#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");
const glob = require("glob");
const chalk = require("chalk");
const { Command } = require("commander");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");

class EnhancedCodeCleaner {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.clientDir = path.join(this.rootDir, "client");
    this.serverDir = path.join(this.rootDir, "server");

    this.includeExtensions = [".js", ".jsx", ".ts", ".tsx"];
    this.indexFiles = ["index.js", "index.jsx", "index.ts", "index.tsx"];

    // Data structures for tracking usage
    this.allFiles = new Set();
    this.fileContents = new Map();
    this.importMap = new Map(); // file -> Set of imported files
    this.exportMap = new Map(); // file -> Set of exported names
    this.usageMap = new Map(); // file -> usage info
    this.componentUsage = new Map(); // component name -> usage info
    this.functionUsage = new Map(); // function name -> usage info
    this.variableUsage = new Map(); // variable name -> usage info
    this.entryPoints = new Set();
    this.reachableFiles = new Set();

    // Prisma specific
    this.prismaModels = new Map();
    this.prismaUsage = new Map();

    this.report = {
      client: {
        unusedFiles: [],
        unusedFunctions: [],
        unusedVariables: [],
        unusedImports: [],
      },
      server: {
        unusedFiles: [],
        unusedFunctions: [],
        unusedVariables: [],
        unusedImports: [],
        prismaIssues: [],
      },
    };
  }

  async analyze() {
    console.log(chalk.blue("🔍 Starting enhanced code analysis..."));

    await this.validateDirectories();
    await this.collectAllFiles();
    await this.readAllFileContents();

    console.log(chalk.cyan(`📊 Analysis Summary:`));
    console.log(chalk.gray(`  Total files found: ${this.allFiles.size}`));
    console.log(chalk.gray(`  Files with content: ${this.fileContents.size}`));

    await this.identifyEntryPoints();
    console.log(
      chalk.gray(`  Entry points identified: ${this.entryPoints.size}`)
    );

    await this.analyzeAllFiles();
    await this.performReachabilityAnalysis();
    await this.analyzePrismaSchemas();
    await this.generateEnhancedReport();
  }

  async validateDirectories() {
    const clientExists = await fs.pathExists(this.clientDir);
    const serverExists = await fs.pathExists(this.serverDir);

    if (!clientExists) {
      console.log(
        chalk.yellow(`⚠️  Client directory not found: ${this.clientDir}`)
      );
    }

    if (!serverExists) {
      console.log(
        chalk.yellow(`⚠️  Server directory not found: ${this.serverDir}`)
      );
    }

    if (!clientExists && !serverExists) {
      console.log(chalk.red("❌ Neither client nor server directories found!"));
      process.exit(1);
    }
  }

  async collectAllFiles() {
    console.log(chalk.cyan("📁 Collecting all files..."));

    if (await fs.pathExists(this.clientDir)) {
      const clientFiles = await this.getFilesRecursively(this.clientDir);
      clientFiles.forEach((file) => this.allFiles.add(file));
      console.log(chalk.gray(`  Found ${clientFiles.length} client files`));
    }

    if (await fs.pathExists(this.serverDir)) {
      const serverFiles = await this.getFilesRecursively(this.serverDir);
      serverFiles.forEach((file) => this.allFiles.add(file));
      console.log(chalk.gray(`  Found ${serverFiles.length} server files`));
    }

    console.log(chalk.gray(`  Total files to analyze: ${this.allFiles.size}`));
  }

  async getFilesRecursively(dir) {
    const files = [];
    const patterns = this.includeExtensions.map((ext) => `${dir}/**/*${ext}`);

    for (const pattern of patterns) {
      const matchedFiles = glob.sync(pattern, {
        absolute: true,
        ignore: [
          "**/node_modules/**",
          "**/dist/**",
          "**/build/**",
          "**/.next/**",
          "**/coverage/**",
          "**/.git/**",
        ],
      });
      files.push(...matchedFiles);
    }

    return [...new Set(files)];
  }

  async readAllFileContents() {
    console.log(chalk.cyan("📖 Reading file contents..."));

    let successCount = 0;
    let errorCount = 0;

    for (const file of this.allFiles) {
      try {
        const content = await fs.readFile(file, "utf8");
        this.fileContents.set(file, content);
        successCount++;
      } catch (error) {
        errorCount++;
        if (errorCount <= 5) {
          // Only show first 5 errors
          console.log(
            chalk.yellow(
              `Failed to read ${path.relative(this.rootDir, file)}: ${
                error.message
              }`
            )
          );
        }
      }
    }

    console.log(chalk.gray(`  Successfully read: ${successCount} files`));
    if (errorCount > 0) {
      console.log(chalk.yellow(`  Failed to read: ${errorCount} files`));
    }
  }

  async identifyEntryPoints() {
    console.log(chalk.cyan("🚪 Identifying entry points..."));

    for (const file of this.allFiles) {
      if (this.isEntryPoint(file)) {
        this.entryPoints.add(file);
        console.log(
          chalk.gray(`  Entry point: ${path.relative(this.rootDir, file)}`)
        );
      }
    }

    // Also check package.json files for entry points
    await this.checkPackageJsonEntries();
  }

  isEntryPoint(filePath) {
    const relativePath = path.relative(this.rootDir, filePath);
    const fileName = path.basename(filePath);

    const entryPatterns = [
      // Main application files
      /^(client|server)\/(src\/)?(index|main|app|server)\.(js|jsx|ts|tsx)$/i,
      /^(client\/)?src\/App\.(js|jsx|ts|tsx)$/i,

      // Route files (common patterns)
      /^server\/(src\/)?routes\/.*\.(js|jsx|ts|tsx)$/i,
      /^server\/(src\/)?api\/.*\.(js|jsx|ts|tsx)$/i,
      /^client\/(src\/)?pages\/.*\.(js|jsx|ts|tsx)$/i,

      // Test files
      /\.(test|spec)\.(js|jsx|ts|tsx)$/i,

      // Config files
      /\.config\.(js|ts)$/i,
      /\.setup\.(js|ts)$/i,

      // Next.js specific
      /^client\/(src\/)?app\/.*page\.(js|jsx|ts|tsx)$/i,
      /^client\/(src\/)?app\/.*layout\.(js|jsx|ts|tsx)$/i,

      // Middleware
      /middleware\.(js|jsx|ts|tsx)$/i,
    ];

    return entryPatterns.some((pattern) => pattern.test(relativePath));
  }

  async checkPackageJsonEntries() {
    const packageJsonFiles = [
      path.join(this.clientDir, "package.json"),
      path.join(this.serverDir, "package.json"),
      path.join(this.rootDir, "package.json"),
    ];

    for (const pkgFile of packageJsonFiles) {
      if (await fs.pathExists(pkgFile)) {
        try {
          const pkg = await fs.readJson(pkgFile);

          // Check main entry
          if (pkg.main) {
            const mainFile = path.resolve(path.dirname(pkgFile), pkg.main);
            const resolvedMain = this.resolveFile(mainFile);
            if (resolvedMain && this.allFiles.has(resolvedMain)) {
              this.entryPoints.add(resolvedMain);
            }
          }

          // Check scripts for entry points
          if (pkg.scripts) {
            Object.values(pkg.scripts).forEach((script) => {
              const matches = script.match(/(?:node|ts-node|tsx)\s+([^\s]+)/g);
              if (matches) {
                matches.forEach((match) => {
                  const filePath = match.split(" ").pop();
                  const fullPath = path.resolve(
                    path.dirname(pkgFile),
                    filePath
                  );
                  const resolvedPath = this.resolveFile(fullPath);
                  if (resolvedPath && this.allFiles.has(resolvedPath)) {
                    this.entryPoints.add(resolvedPath);
                  }
                });
              }
            });
          }
        } catch (error) {
          console.log(
            chalk.yellow(`Failed to read ${pkgFile}: ${error.message}`)
          );
        }
      }
    }
  }

  async analyzeAllFiles() {
    console.log(chalk.cyan("🔍 Analyzing file dependencies..."));

    for (const file of this.allFiles) {
      await this.analyzeFile(file);
    }
  }

  async analyzeFile(filePath) {
    const content = this.fileContents.get(filePath);
    if (!content) return;

    const context = filePath.includes(path.sep + "client" + path.sep)
      ? "client"
      : "server";

    try {
      const ast = this.parseFile(content, filePath);
      if (!ast) return;

      // Initialize usage tracking for this file
      const usage = {
        context,
        imports: new Set(),
        exports: new Set(),
        functions: new Map(),
        variables: new Map(),
        components: new Set(),
        references: new Set(),
        dynamicImports: new Set(),
        stringReferences: new Set(),
      };

      this.usageMap.set(filePath, usage);

      traverse(ast, {
        // Handle imports
        ImportDeclaration: (path) => {
          this.handleImportDeclaration(path, filePath, usage);
        },

        // Handle require calls
        CallExpression: (path) => {
          this.handleCallExpression(path, filePath, usage);
        },

        // Handle exports
        ExportNamedDeclaration: (path) => {
          this.handleNamedExport(path, filePath, usage);
        },

        ExportDefaultDeclaration: (path) => {
          this.handleDefaultExport(path, filePath, usage);
        },

        ExportAllDeclaration: (path) => {
          this.handleExportAll(path, filePath, usage);
        },

        // Track function declarations
        FunctionDeclaration: (path) => {
          this.handleFunctionDeclaration(path, filePath, usage);
        },

        // Track variable declarations
        VariableDeclarator: (path) => {
          this.handleVariableDeclaration(path, filePath, usage);
        },

        // Track identifier usage
        Identifier: (path) => {
          this.handleIdentifier(path, filePath, usage);
        },

        // Track JSX usage
        JSXIdentifier: (path) => {
          this.handleJSXIdentifier(path, filePath, usage);
        },

        // Track member expressions (for object properties)
        MemberExpression: (path) => {
          this.handleMemberExpression(path, filePath, usage);
        },

        // Track string literals for potential dynamic references
        StringLiteral: (path) => {
          this.handleStringLiteral(path, filePath, usage);
        },
      });
    } catch (error) {
      console.log(chalk.red(`Error analyzing ${filePath}: ${error.message}`));
    }
  }

  handleImportDeclaration(path, filePath, usage) {
    const source = path.node.source.value;
    const resolvedPath = this.resolveImport(source, filePath);

    if (resolvedPath && this.allFiles.has(resolvedPath)) {
      usage.imports.add(resolvedPath);

      if (!this.importMap.has(filePath)) {
        this.importMap.set(filePath, new Set());
      }
      this.importMap.get(filePath).add(resolvedPath);
    }

    // Track imported names
    path.node.specifiers.forEach((spec) => {
      let importedName;
      if (t.isImportDefaultSpecifier(spec)) {
        importedName = "default";
      } else if (t.isImportSpecifier(spec)) {
        importedName = spec.imported.name;
      } else if (t.isImportNamespaceSpecifier(spec)) {
        importedName = "*";
      }

      if (importedName) {
        this.trackImportUsage(spec.local.name, importedName, source, filePath);
      }
    });
  }

  handleCallExpression(path, filePath, usage) {
    const node = path.node;

    // Handle require() calls
    if (
      t.isIdentifier(node.callee, { name: "require" }) &&
      node.arguments.length > 0 &&
      t.isStringLiteral(node.arguments[0])
    ) {
      const source = node.arguments[0].value;
      const resolvedPath = this.resolveImport(source, filePath);

      if (resolvedPath && this.allFiles.has(resolvedPath)) {
        usage.imports.add(resolvedPath);

        if (!this.importMap.has(filePath)) {
          this.importMap.set(filePath, new Set());
        }
        this.importMap.get(filePath).add(resolvedPath);
      }
    }

    // Handle dynamic imports
    if (
      t.isImport(node.callee) &&
      node.arguments.length > 0 &&
      t.isStringLiteral(node.arguments[0])
    ) {
      const source = node.arguments[0].value;
      const resolvedPath = this.resolveImport(source, filePath);

      if (resolvedPath && this.allFiles.has(resolvedPath)) {
        usage.dynamicImports.add(resolvedPath);

        if (!this.importMap.has(filePath)) {
          this.importMap.set(filePath, new Set());
        }
        this.importMap.get(filePath).add(resolvedPath);
      }
    }

    // Handle Prisma client usage
    if (t.isMemberExpression(node.callee)) {
      const objectName = this.getMemberExpressionRoot(node.callee);
      if (objectName === "prisma" || objectName === "db") {
        const modelName = this.extractPrismaModelName(node.callee);
        if (modelName) {
          this.trackPrismaUsage(modelName, filePath, "query");
        }
      }
    }
  }

  handleNamedExport(path, filePath, usage) {
    if (!this.exportMap.has(filePath)) {
      this.exportMap.set(filePath, new Set());
    }

    if (path.node.declaration) {
      // export const/function/class
      if (t.isFunctionDeclaration(path.node.declaration)) {
        const name = path.node.declaration.id?.name;
        if (name) {
          usage.exports.add(name);
          this.exportMap.get(filePath).add(name);
        }
      } else if (t.isVariableDeclaration(path.node.declaration)) {
        path.node.declaration.declarations.forEach((decl) => {
          if (t.isIdentifier(decl.id)) {
            usage.exports.add(decl.id.name);
            this.exportMap.get(filePath).add(decl.id.name);
          }
        });
      } else if (t.isClassDeclaration(path.node.declaration)) {
        const name = path.node.declaration.id?.name;
        if (name) {
          usage.exports.add(name);
          this.exportMap.get(filePath).add(name);
        }
      }
    }

    // Handle export { name } from 'module'
    if (path.node.specifiers) {
      path.node.specifiers.forEach((spec) => {
        if (t.isExportSpecifier(spec)) {
          const exportName = spec.exported.name;
          usage.exports.add(exportName);
          this.exportMap.get(filePath).add(exportName);
        }
      });
    }

    // Handle re-exports
    if (path.node.source) {
      const source = path.node.source.value;
      const resolvedPath = this.resolveImport(source, filePath);

      if (resolvedPath && this.allFiles.has(resolvedPath)) {
        usage.imports.add(resolvedPath);

        if (!this.importMap.has(filePath)) {
          this.importMap.set(filePath, new Set());
        }
        this.importMap.get(filePath).add(resolvedPath);
      }
    }
  }

  handleDefaultExport(path, filePath, usage) {
    if (!this.exportMap.has(filePath)) {
      this.exportMap.set(filePath, new Set());
    }

    usage.exports.add("default");
    this.exportMap.get(filePath).add("default");
  }

  handleExportAll(path, filePath, usage) {
    const source = path.node.source.value;
    const resolvedPath = this.resolveImport(source, filePath);

    if (resolvedPath && this.allFiles.has(resolvedPath)) {
      usage.imports.add(resolvedPath);

      if (!this.importMap.has(filePath)) {
        this.importMap.set(filePath, new Set());
      }
      this.importMap.get(filePath).add(resolvedPath);
    }
  }

  handleFunctionDeclaration(path, filePath, usage) {
    const name = path.node.id?.name;
    if (name) {
      usage.functions.set(name, {
        type: "declaration",
        line: path.node.loc?.start?.line,
        exported: usage.exports.has(name),
      });

      this.trackFunctionDeclaration(name, filePath, "declaration");
    }
  }

  handleVariableDeclaration(path, filePath, usage) {
    if (t.isIdentifier(path.node.id)) {
      const name = path.node.id.name;

      let type = "variable";
      if (
        t.isArrowFunctionExpression(path.node.init) ||
        t.isFunctionExpression(path.node.init)
      ) {
        type = "function";
        usage.functions.set(name, {
          type: "expression",
          line: path.node.loc?.start?.line,
          exported: usage.exports.has(name),
        });
        this.trackFunctionDeclaration(name, filePath, "expression");
      } else {
        usage.variables.set(name, {
          type,
          line: path.node.loc?.start?.line,
          exported: usage.exports.has(name),
        });
        this.trackVariableDeclaration(name, filePath);
      }
    }
  }

  handleIdentifier(path, filePath, usage) {
    if (path.isReferencedIdentifier()) {
      const name = path.node.name;
      usage.references.add(name);

      this.trackIdentifierUsage(name, filePath);
    }
  }

  handleJSXIdentifier(path, filePath, usage) {
    if (
      path.parent.type === "JSXOpeningElement" ||
      path.parent.type === "JSXClosingElement"
    ) {
      const name = path.node.name;

      // Only track capitalized names (React components)
      if (name[0] === name[0].toUpperCase()) {
        usage.components.add(name);
        usage.references.add(name);

        this.trackComponentUsage(name, filePath);
      }
    }
  }

  handleMemberExpression(path, filePath, usage) {
    // Track property access for potential usage
    const root = this.getMemberExpressionRoot(path.node);
    if (root) {
      usage.references.add(root);
      this.trackIdentifierUsage(root, filePath);
    }
  }

  handleStringLiteral(path, filePath, usage) {
    const value = path.node.value;
    usage.stringReferences.add(value);

    // Check if this might be a file reference
    if (value.includes("/") || value.includes("\\") || value.includes(".")) {
      const possiblePath = this.resolveImport(value, filePath);
      if (possiblePath && this.allFiles.has(possiblePath)) {
        usage.imports.add(possiblePath);

        if (!this.importMap.has(filePath)) {
          this.importMap.set(filePath, new Set());
        }
        this.importMap.get(filePath).add(possiblePath);
      }
    }

    // Check for Prisma model references
    if (this.prismaModels.has(value)) {
      this.trackPrismaUsage(value, filePath, "string_reference");
    }
  }

  trackImportUsage(localName, importedName, source, filePath) {
    const key = `${filePath}:${localName}`;
    if (!this.variableUsage.has(key)) {
      this.variableUsage.set(key, {
        name: localName,
        importedName,
        source,
        filePath,
        references: new Set(),
        isImport: true,
      });
    }
  }

  trackFunctionDeclaration(name, filePath, type) {
    const key = `${filePath}:${name}`;
    if (!this.functionUsage.has(key)) {
      this.functionUsage.set(key, {
        name,
        filePath,
        type,
        references: new Set(),
        isExported: false,
      });
    }

    // Check if exported
    const usage = this.usageMap.get(filePath);
    if (usage && usage.exports.has(name)) {
      this.functionUsage.get(key).isExported = true;
    }
  }

  trackVariableDeclaration(name, filePath) {
    const key = `${filePath}:${name}`;
    if (!this.variableUsage.has(key)) {
      this.variableUsage.set(key, {
        name,
        filePath,
        references: new Set(),
        isImport: false,
      });
    }
  }

  trackIdentifierUsage(name, filePath) {
    // Track usage of functions
    for (const [key, func] of this.functionUsage) {
      if (func.name === name && func.filePath !== filePath) {
        func.references.add(filePath);
      }
    }

    // Track usage of variables/imports
    for (const [key, variable] of this.variableUsage) {
      if (variable.name === name) {
        variable.references.add(filePath);
      }
    }
  }

  trackComponentUsage(name, filePath) {
    if (!this.componentUsage.has(name)) {
      this.componentUsage.set(name, {
        name,
        usages: new Set(),
      });
    }
    this.componentUsage.get(name).usages.add(filePath);
  }

  trackPrismaUsage(modelName, filePath, type) {
    if (!this.prismaUsage.has(modelName)) {
      this.prismaUsage.set(modelName, {
        queries: new Set(),
        stringReferences: new Set(),
        typeReferences: new Set(),
      });
    }

    const usage = this.prismaUsage.get(modelName);
    if (type === "query") {
      usage.queries.add(filePath);
    } else if (type === "string_reference") {
      usage.stringReferences.add(filePath);
    } else if (type === "type_reference") {
      usage.typeReferences.add(filePath);
    }
  }

  resolveImport(source, fromFile) {
    // Handle relative imports
    if (source.startsWith("./") || source.startsWith("../")) {
      const basePath = path.resolve(path.dirname(fromFile), source);
      return this.resolveFile(basePath);
    }

    // Handle absolute imports from src
    if (source.startsWith("src/")) {
      const clientSrcPath = path.join(this.clientDir, source);
      const serverSrcPath = path.join(this.serverDir, source);

      const resolvedClient = this.resolveFile(clientSrcPath);
      if (resolvedClient && this.allFiles.has(resolvedClient)) {
        return resolvedClient;
      }

      const resolvedServer = this.resolveFile(serverSrcPath);
      if (resolvedServer && this.allFiles.has(resolvedServer)) {
        return resolvedServer;
      }
    }

    // Handle imports from root (assuming they're in src)
    if (!source.includes("/") || !source.startsWith(".")) {
      const currentDir = path.dirname(fromFile);
      const context = currentDir.includes("client")
        ? this.clientDir
        : this.serverDir;
      const srcPath = path.join(context, "src", source);

      return this.resolveFile(srcPath);
    }

    return null;
  }

  resolveFile(basePath) {
    // Try exact path first
    if (fs.existsSync(basePath) && this.allFiles.has(basePath)) {
      return basePath;
    }

    // Try with extensions
    for (const ext of this.includeExtensions) {
      const withExt = basePath + ext;
      if (fs.existsSync(withExt) && this.allFiles.has(withExt)) {
        return withExt;
      }
    }

    // Try as directory with index files
    if (fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()) {
      for (const indexFile of this.indexFiles) {
        const indexPath = path.join(basePath, indexFile);
        if (fs.existsSync(indexPath) && this.allFiles.has(indexPath)) {
          return indexPath;
        }
      }
    }

    return null;
  }

  async performReachabilityAnalysis() {
    console.log(chalk.cyan("🔗 Performing reachability analysis..."));

    // Start from entry points
    const visited = new Set();
    const queue = Array.from(this.entryPoints);

    while (queue.length > 0) {
      const currentFile = queue.shift();

      if (visited.has(currentFile)) {
        continue;
      }

      visited.add(currentFile);
      this.reachableFiles.add(currentFile);

      // Add all files imported by this file
      if (this.importMap.has(currentFile)) {
        for (const importedFile of this.importMap.get(currentFile)) {
          if (!visited.has(importedFile)) {
            queue.push(importedFile);
          }
        }
      }

      // Also check for string-based references
      this.checkStringReferences(currentFile, visited, queue);
    }

    console.log(
      chalk.gray(
        `  Reachable files: ${this.reachableFiles.size}/${this.allFiles.size}`
      )
    );
  }

  checkStringReferences(currentFile, visited, queue) {
    const content = this.fileContents.get(currentFile);
    if (!content) return;

    // Look for potential file references in strings
    for (const otherFile of this.allFiles) {
      if (visited.has(otherFile)) continue;

      const relativePath = path.relative(path.dirname(currentFile), otherFile);
      const fileName = path.basename(otherFile, path.extname(otherFile));

      // Check various patterns
      const patterns = [
        relativePath,
        fileName,
        path.relative(this.rootDir, otherFile),
        otherFile.replace(this.rootDir, "").replace(/^[\/\\]/, ""),
      ];

      for (const pattern of patterns) {
        if (
          content.includes(pattern) ||
          content.includes(`'${pattern}'`) ||
          content.includes(`"${pattern}"`) ||
          content.includes(`\`${pattern}\``)
        ) {
          queue.push(otherFile);
          break;
        }
      }
    }
  }

  parseFile(content, filePath) {
    const isTypeScript = filePath.endsWith(".ts") || filePath.endsWith(".tsx");
    const isJSX = filePath.endsWith(".jsx") || filePath.endsWith(".tsx");
    const isFlow = content.includes("@flow") || filePath.includes(".flow.");

    const plugins = [
      "dynamicImport",
      "objectRestSpread",
      "decorators-legacy",
      "classProperties",
      "asyncGenerators",
      "functionBind",
      "exportDefaultFrom",
      "exportNamespaceFrom",
      "nullishCoalescingOperator",
      "optionalChaining",
      "topLevelAwait",
      "importMeta",
      "bigInt",
    ];

    if (isTypeScript) {
      plugins.push("typescript");
    }

    if (isJSX) {
      plugins.push("jsx");
    }

    if (isFlow) {
      plugins.push("flow");
    }

    try {
      return parser.parse(content, {
        sourceType: "module",
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins,
      });
    } catch (error) {
      // Try as script if module parsing fails
      try {
        return parser.parse(content, {
          sourceType: "script",
          allowImportExportEverywhere: true,
          allowReturnOutsideFunction: true,
          plugins,
        });
      } catch (scriptError) {
        console.log(
          chalk.yellow(`Failed to parse ${filePath}: ${error.message}`)
        );
        return null;
      }
    }
  }

  getMemberExpressionRoot(node) {
    if (t.isIdentifier(node.object)) {
      return node.object.name;
    } else if (t.isMemberExpression(node.object)) {
      return this.getMemberExpressionRoot(node.object);
    }
    return null;
  }

  extractPrismaModelName(node) {
    if (t.isMemberExpression(node) && t.isIdentifier(node.property)) {
      return node.property.name;
    }
    return null;
  }

  async analyzePrismaSchemas() {
    console.log(chalk.cyan("🗄️  Analyzing Prisma schemas..."));

    const schemaFiles = [];
    for (const dir of [this.serverDir, this.rootDir]) {
      const schemas = glob.sync("**/schema.prisma", {
        cwd: dir,
        absolute: true,
      });
      schemaFiles.push(...schemas);
    }

    if (schemaFiles.length === 0) {
      console.log(chalk.yellow("⚠️  No Prisma schema files found"));
      return;
    }

    for (const schemaFile of schemaFiles) {
      await this.analyzePrismaSchema(schemaFile);
    }
  }

  async analyzePrismaSchema(schemaPath) {
    try {
      const content = await fs.readFile(schemaPath, "utf8");
      const models = this.parsePrismaSchema(content);

      console.log(chalk.gray(`  Found ${models.length} Prisma models`));

      models.forEach((model) => {
        this.prismaModels.set(model.name, model);
      });

      // Check for unused models and fields
      for (const model of models) {
        const modelUsage = this.prismaUsage.get(model.name);
        const isUsed =
          modelUsage &&
          (modelUsage.queries.size > 0 ||
            modelUsage.stringReferences.size > 0 ||
            modelUsage.typeReferences.size > 0);

        if (!isUsed) {
          // Double-check by searching content
          const isReallyUsed = await this.searchInAllFiles(model.name);
          if (!isReallyUsed) {
            this.report.server.prismaIssues.push({
              type: "unused_model",
              model: model.name,
              file: path.relative(this.rootDir, schemaPath),
              fields: model.fields,
            });
          }
        } else {
          // Check for unused fields
          const unusedFields = [];
          for (const field of model.fields) {
            if (!this.isSystemField(field.name)) {
              const isFieldUsed = await this.searchInAllFiles(field.name);
              if (!isFieldUsed) {
                unusedFields.push(field);
              }
            }
          }

          if (unusedFields.length > 0) {
            this.report.server.prismaIssues.push({
              type: "unused_fields",
              model: model.name,
              file: path.relative(this.rootDir, schemaPath),
              unusedFields,
            });
          }
        }
      }
    } catch (error) {
      console.log(
        chalk.red(
          `Error analyzing Prisma schema ${schemaPath}: ${error.message}`
        )
      );
    }
  }

  parsePrismaSchema(content) {
    const models = [];
    const lines = content.split("\n");
    let currentModel = null;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith("model ")) {
        const modelName = trimmed.split(" ")[1];
        currentModel = {
          name: modelName,
          fields: [],
        };
      } else if (trimmed === "}" && currentModel) {
        models.push(currentModel);
        currentModel = null;
      } else if (
        currentModel &&
        trimmed &&
        !trimmed.startsWith("//") &&
        !trimmed.startsWith("@@")
      ) {
        const fieldMatch = trimmed.match(/^(\w+)\s+(\w+)/);
        if (fieldMatch) {
          currentModel.fields.push({
            name: fieldMatch[1],
            type: fieldMatch[2],
          });
        }
      }
    }

    return models;
  }

  async searchInAllFiles(searchTerm) {
    const patterns = [
      new RegExp(`\\b${this.escapeRegex(searchTerm)}\\b`, "i"),
      new RegExp(`['"\`]${this.escapeRegex(searchTerm)}['"\`]`, "i"),
      new RegExp(`\\.${this.escapeRegex(searchTerm)}\\b`, "i"),
    ];

    for (const content of this.fileContents.values()) {
      if (patterns.some((pattern) => pattern.test(content))) {
        return true;
      }
    }

    return false;
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  isSystemField(fieldName) {
    const systemFields = [
      "id",
      "createdAt",
      "updatedAt",
      "created_at",
      "updated_at",
    ];
    return systemFields.includes(fieldName);
  }

  async generateEnhancedReport() {
    console.log(chalk.cyan("📊 Generating enhanced report..."));

    // Find unused files (not reachable from entry points)
    for (const file of this.allFiles) {
      if (!this.reachableFiles.has(file) && !this.entryPoints.has(file)) {
        const context = file.includes(path.sep + "client" + path.sep)
          ? "client"
          : "server";
        this.report[context].unusedFiles.push(
          path.relative(this.rootDir, file)
        );
      }
    }

    // Find unused functions
    for (const [key, func] of this.functionUsage) {
      if (!func.isExported && func.references.size === 0) {
        const context = func.filePath.includes(path.sep + "client" + path.sep)
          ? "client"
          : "server";
        this.report[context].unusedFunctions.push({
          name: func.name,
          file: path.relative(this.rootDir, func.filePath),
          type: func.type,
        });
      }
    }

    // Find unused variables and imports
    for (const [key, variable] of this.variableUsage) {
      if (variable.references.size === 0 && !variable.name.startsWith("_")) {
        const context = variable.filePath.includes(
          path.sep + "client" + path.sep
        )
          ? "client"
          : "server";

        if (variable.isImport) {
          this.report[context].unusedImports.push({
            name: variable.name,
            importedName: variable.importedName,
            source: variable.source,
            file: path.relative(this.rootDir, variable.filePath),
          });
        } else {
          this.report[context].unusedVariables.push({
            name: variable.name,
            file: path.relative(this.rootDir, variable.filePath),
          });
        }
      }
    }

    this.printEnhancedReport();
    await this.saveEnhancedReport();
  }

  printEnhancedReport() {
    console.log(chalk.green("\n🎉 Enhanced Analysis Complete!"));
    console.log(chalk.blue("=".repeat(60)));

    // Summary first
    const clientTotal =
      this.report.client.unusedFiles.length +
      this.report.client.unusedFunctions.length +
      this.report.client.unusedVariables.length +
      this.report.client.unusedImports.length;

    const serverTotal =
      this.report.server.unusedFiles.length +
      this.report.server.unusedFunctions.length +
      this.report.server.unusedVariables.length +
      this.report.server.unusedImports.length +
      this.report.server.prismaIssues.length;

    console.log(chalk.cyan("\n📊 SUMMARY:"));
    console.log(chalk.yellow(`  Entry Points Found: ${this.entryPoints.size}`));
    console.log(chalk.yellow(`  Total Files: ${this.allFiles.size}`));
    console.log(chalk.yellow(`  Reachable Files: ${this.reachableFiles.size}`));
    console.log(chalk.yellow(`  Client Issues: ${clientTotal}`));
    console.log(chalk.yellow(`  Server Issues: ${serverTotal}`));
    console.log(chalk.yellow(`  Total Issues: ${clientTotal + serverTotal}`));

    // Detailed reports
    console.log(chalk.cyan("\n📱 CLIENT ANALYSIS:"));
    this.printContextReport("client");

    console.log(chalk.cyan("\n🖥️  SERVER ANALYSIS:"));
    this.printContextReport("server");

    if (this.report.server.prismaIssues.length > 0) {
      console.log(
        chalk.cyan(
          `\n🗄️  PRISMA SCHEMA ISSUES (${this.report.server.prismaIssues.length}):`
        )
      );
      this.report.server.prismaIssues.forEach((issue) => {
        if (issue.type === "unused_model") {
          console.log(chalk.red(`  ❌ Unused model: ${issue.model}`));
        } else if (issue.type === "unused_fields") {
          console.log(
            chalk.red(
              `  ❌ Model ${issue.model} has unused fields: ${issue.unusedFields
                .map((f) => f.name)
                .join(", ")}`
            )
          );
        }
      });
    }

    if (clientTotal + serverTotal === 0) {
      console.log(
        chalk.green("\n✨ Excellent! No unused code found in your project.")
      );
    } else {
      console.log(
        chalk.yellow(
          "\n📄 Detailed report saved to enhanced-cleanup-report.json"
        )
      );
    }
  }

  printContextReport(context) {
    const report = this.report[context];

    if (report.unusedFiles.length > 0) {
      console.log(
        chalk.red(`  ❌ Unused Files (${report.unusedFiles.length}):`)
      );
      report.unusedFiles.forEach((file) => {
        console.log(chalk.red(`    • ${file}`));
      });
    }

    if (report.unusedFunctions.length > 0) {
      console.log(
        chalk.red(`  ❌ Unused Functions (${report.unusedFunctions.length}):`)
      );
      report.unusedFunctions.forEach((func) => {
        console.log(
          chalk.red(`    • ${func.name} (${func.type}) in ${func.file}`)
        );
      });
    }

    if (report.unusedVariables.length > 0) {
      console.log(
        chalk.red(`  ❌ Unused Variables (${report.unusedVariables.length}):`)
      );
      report.unusedVariables.forEach((variable) => {
        console.log(chalk.red(`    • ${variable.name} in ${variable.file}`));
      });
    }

    if (report.unusedImports.length > 0) {
      console.log(
        chalk.red(`  ❌ Unused Imports (${report.unusedImports.length}):`)
      );
      report.unusedImports.forEach((imp) => {
        console.log(
          chalk.red(`    • ${imp.name} from "${imp.source}" in ${imp.file}`)
        );
      });
    }

    const contextTotal =
      report.unusedFiles.length +
      report.unusedFunctions.length +
      report.unusedVariables.length +
      report.unusedImports.length;

    if (contextTotal === 0) {
      console.log(chalk.green(`  ✅ No unused code found in ${context}`));
    }
  }

  async saveEnhancedReport() {
    const reportData = {
      ...this.report,
      metadata: {
        generatedAt: new Date().toISOString(),
        totalFiles: this.allFiles.size,
        entryPoints: Array.from(this.entryPoints).map((f) =>
          path.relative(this.rootDir, f)
        ),
        reachableFiles: this.reachableFiles.size,
        analysis: {
          client: this.getAnalysisStats("client"),
          server: this.getAnalysisStats("server"),
        },
      },
    };

    const reportPath = path.join(this.rootDir, "enhanced-cleanup-report.json");
    await fs.writeJson(reportPath, reportData, { spaces: 2 });

    const mdReportPath = path.join(this.rootDir, "enhanced-cleanup-report.md");
    const mdContent = this.generateMarkdownReport(reportData);
    await fs.writeFile(mdReportPath, mdContent);
  }

  getAnalysisStats(context) {
    const report = this.report[context];
    return {
      unusedFiles: report.unusedFiles.length,
      unusedFunctions: report.unusedFunctions.length,
      unusedVariables: report.unusedVariables.length,
      unusedImports: report.unusedImports.length,
      total:
        report.unusedFiles.length +
        report.unusedFunctions.length +
        report.unusedVariables.length +
        report.unusedImports.length,
    };
  }

  generateMarkdownReport(reportData) {
    let md = "# Enhanced Code Cleanup Report\n\n";
    md += `Generated: ${reportData.metadata.generatedAt}\n\n`;

    md += "## 📊 Analysis Summary\n\n";
    md += `- **Total Files Analyzed**: ${reportData.metadata.totalFiles}\n`;
    md += `- **Entry Points Found**: ${reportData.metadata.entryPoints.length}\n`;
    md += `- **Reachable Files**: ${reportData.metadata.reachableFiles}\n`;
    md += `- **Client Issues**: ${reportData.metadata.analysis.client.total}\n`;
    md += `- **Server Issues**: ${reportData.metadata.analysis.server.total}\n\n`;

    md += "### Entry Points\n\n";
    reportData.metadata.entryPoints.forEach((entry) => {
      md += `- \`${entry}\`\n`;
    });
    md += "\n";

    md += this.generateContextMarkdown("Client", reportData.client);
    md += this.generateContextMarkdown("Server", reportData.server);

    if (
      reportData.server.prismaIssues &&
      reportData.server.prismaIssues.length > 0
    ) {
      md += "## 🗄️ Prisma Schema Issues\n\n";
      reportData.server.prismaIssues.forEach((issue) => {
        if (issue.type === "unused_model") {
          md += `- **❌ Unused Model**: \`${issue.model}\` in \`${issue.file}\`\n`;
        } else if (issue.type === "unused_fields") {
          md += `- **❌ Unused Fields in \`${
            issue.model
          }\`**: ${issue.unusedFields
            .map((f) => `\`${f.name}\``)
            .join(", ")}\n`;
        }
      });
      md += "\n";
    }

    md += "## ⚠️ Important Notes\n\n";
    md +=
      "- This analysis uses static code analysis and reachability from entry points\n";
    md +=
      '- Some "unused" items might be used dynamically or through reflection\n';
    md += "- Always test your application after making changes\n";
    md += "- Consider keeping items that might be used by external systems\n";
    md += "- Variables starting with `_` are intentionally ignored\n\n";

    return md;
  }

  generateContextMarkdown(contextName, report) {
    let md = `## 📱 ${contextName} Analysis\n\n`;

    if (report.unusedFiles && report.unusedFiles.length > 0) {
      md += `### ❌ Unused Files (${report.unusedFiles.length})\n\n`;
      report.unusedFiles.forEach((file) => {
        md += `- \`${file}\`\n`;
      });
      md += "\n";
    }

    if (report.unusedFunctions && report.unusedFunctions.length > 0) {
      md += `### ❌ Unused Functions (${report.unusedFunctions.length})\n\n`;
      report.unusedFunctions.forEach((func) => {
        md += `- **${func.name}** (${func.type}) in \`${func.file}\`\n`;
      });
      md += "\n";
    }

    if (report.unusedVariables && report.unusedVariables.length > 0) {
      md += `### ❌ Unused Variables (${report.unusedVariables.length})\n\n`;
      report.unusedVariables.forEach((variable) => {
        md += `- **${variable.name}** in \`${variable.file}\`\n`;
      });
      md += "\n";
    }

    if (report.unusedImports && report.unusedImports.length > 0) {
      md += `### ❌ Unused Imports (${report.unusedImports.length})\n\n`;
      report.unusedImports.forEach((imp) => {
        md += `- **${imp.name}** from \`${imp.source}\` in \`${imp.file}\`\n`;
      });
      md += "\n";
    }

    const total =
      (report.unusedFiles?.length || 0) +
      (report.unusedFunctions?.length || 0) +
      (report.unusedVariables?.length || 0) +
      (report.unusedImports?.length || 0);

    if (total === 0) {
      md += `✅ No unused code found in ${contextName.toLowerCase()}\n\n`;
    }

    return md;
  }
}

// CLI Setup
const program = new Command();

program
  .name("enhanced-code-cleaner")
  .description(
    "Enhanced code cleaner with better accuracy and reachability analysis"
  )
  .version("2.0.0")
  .option("-d, --dir <directory>", "Root directory to analyze", process.cwd())
  .action(async (options) => {
    const cleaner = new EnhancedCodeCleaner({
      rootDir: path.resolve(options.dir),
    });

    try {
      await cleaner.analyze();
    } catch (error) {
      console.error(chalk.red("Analysis failed:", error.message));
      process.exit(1);
    }
  });

program.parse();
