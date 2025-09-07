import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/src/services/api";
import { Alert } from "react-native";

interface ShoppingListItem {
  is_purchased: any;
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  added_from?: string;
  product_barcode?: string;
  estimated_price?: number;
}

export const useShoppingList = () => {
  const queryClient = useQueryClient();

  // Get shopping list
  const {
    data: shoppingList = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["shoppingList"],
    queryFn: async () => {
      try {
        const response = await api.get("/shopping-lists");
        return response.data.data || [];
      } catch (error) {
        console.error("Error fetching shopping list:", error);
        throw error;
      }
    },
    staleTime: 0, // Always consider data stale for immediate updates
    gcTime: 2 * 60 * 1000, // 2 minutes cache time
  });

  // Add single item
  const addItemMutation = useMutation({
    mutationFn: async (item: ShoppingListItem) => {
      console.log("🛒 Adding item to shopping list:", item);
      const response = await api.post("/shopping-lists", item);
      return response.data;
    },
    onMutate: async (newItem) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["shoppingList"] });

      // Snapshot previous value
      const previousList = queryClient.getQueryData<ShoppingListItem[]>([
        "shoppingList",
      ]);

      // Optimistically update the cache
      queryClient.setQueryData<ShoppingListItem[]>(
        ["shoppingList"],
        (old = []) => [
          ...old,
          { ...newItem, id: `temp-${Date.now()}`, is_purchased: false },
        ]
      );

      return { previousList };
    },
    onSuccess: (data) => {
      console.log("✅ Item added successfully:", data);

      // Invalidate and refetch to get the latest data
      queryClient.invalidateQueries({ queryKey: ["shoppingList"] });
      queryClient.refetchQueries({ queryKey: ["shoppingList"] });

      Alert.alert("Success", "Item added to shopping list!");
    },
    onError: (error, variables, context) => {
      console.error("❌ Error adding item:", error);

      // Rollback optimistic update
      if (context?.previousList) {
        queryClient.setQueryData(["shoppingList"], context.previousList);
      }

      Alert.alert("Error", "Failed to add item to shopping list");
    },
  });

  // Bulk add items
  const bulkAddMutation = useMutation({
    mutationFn: async (items: ShoppingListItem[]) => {
      console.log("🛒 Bulk adding items to shopping list:", items.length);
      const response = await api.post("/shopping-lists/bulk-add", { items });
      return response.data;
    },
    onMutate: async (newItems) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["shoppingList"] });

      // Snapshot previous value
      const previousList = queryClient.getQueryData<ShoppingListItem[]>([
        "shoppingList",
      ]);

      // Optimistically update the cache
      queryClient.setQueryData<ShoppingListItem[]>(
        ["shoppingList"],
        (old = []) => [
          ...old,
          ...newItems.map((item, index) => ({
            ...item,
            id: `temp-bulk-${Date.now()}-${index}`,
            is_purchased: false,
          })),
        ]
      );

      return { previousList };
    },
    onSuccess: (data) => {
      console.log("✅ Bulk add completed:", data);

      // Invalidate and refetch to get the latest data
      queryClient.invalidateQueries({ queryKey: ["shoppingList"] });
      queryClient.refetchQueries({ queryKey: ["shoppingList"] });

      Alert.alert(
        "Success",
        `${data.data?.total || 0} items added to shopping list!`
      );
    },
    onError: (error, variables, context) => {
      console.error("❌ Error bulk adding items:", error);

      // Rollback optimistic update
      if (context?.previousList) {
        queryClient.setQueryData(["shoppingList"], context.previousList);
      }

      Alert.alert("Error", "Failed to add items to shopping list");
    },
  });

  // Update item
  const updateItemMutation = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<ShoppingListItem> & { id: string }) => {
      const response = await api.put(`/shopping-lists/${id}`, updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shoppingList"] });
      queryClient.refetchQueries({ queryKey: ["shoppingList"] });
    },
    onError: (error) => {
      console.error("❌ Error updating item:", error);
      Alert.alert("Error", "Failed to update item");
    },
  });

  // Delete item
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/shopping-lists/${id}`);
      return response.data;
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ["shoppingList"] });

      const previousList = queryClient.getQueryData<ShoppingListItem[]>([
        "shoppingList",
      ]);

      queryClient.setQueryData<ShoppingListItem[]>(
        ["shoppingList"],
        (old = []) => old.filter((item) => item.id !== deletedId)
      );

      return { previousList };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shoppingList"] });
      Alert.alert("Success", "Item deleted from shopping list");
    },
    onError: (error, variables, context) => {
      console.error("❌ Error deleting item:", error);

      if (context?.previousList) {
        queryClient.setQueryData(["shoppingList"], context.previousList);
      }

      Alert.alert("Error", "Failed to delete item");
    },
  });

  // Toggle purchased status
  const togglePurchasedMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put(`/shopping-lists/${id}/toggle`);
      return response.data;
    },
    onMutate: async (toggledId) => {
      await queryClient.cancelQueries({ queryKey: ["shoppingList"] });

      const previousList = queryClient.getQueryData<ShoppingListItem[]>([
        "shoppingList",
      ]);

      queryClient.setQueryData<ShoppingListItem[]>(
        ["shoppingList"],
        (old = []) =>
          old.map((item) =>
            item.id === toggledId
              ? { ...item, is_purchased: !item.is_purchased }
              : item
          )
      );

      return { previousList };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shoppingList"] });
    },
    onError: (error, variables, context) => {
      console.error("❌ Error toggling item:", error);

      if (context?.previousList) {
        queryClient.setQueryData(["shoppingList"], context.previousList);
      }

      Alert.alert("Error", "Failed to update item status");
    },
  });

  // Force refresh function
  const forceRefresh = async () => {
    try {
      console.log("🔄 Force refreshing shopping list...");
      await queryClient.cancelQueries({ queryKey: ["shoppingList"] });
      queryClient.removeQueries({ queryKey: ["shoppingList"] });
      await queryClient.refetchQueries({ queryKey: ["shoppingList"] });
      console.log("✅ Shopping list refreshed");
    } catch (error) {
      console.error("❌ Error refreshing shopping list:", error);
    }
  };

  return {
    shoppingList,
    isLoading,
    error,
    refetch,
    forceRefresh,
    addItem: addItemMutation.mutate,
    bulkAddItems: bulkAddMutation.mutate,
    updateItem: updateItemMutation.mutate,
    deleteItem: deleteItemMutation.mutate,
    togglePurchased: togglePurchasedMutation.mutate,
    isAddingItem: addItemMutation.isPending,
    isBulkAdding: bulkAddMutation.isPending,
    isUpdating: updateItemMutation.isPending,
    isDeleting: deleteItemMutation.isPending,
    isToggling: togglePurchasedMutation.isPending,
  };
};
