import { useMemo } from "react";

export const useFormattedTime = (dateString: string) => {
  const formattedTime = useMemo(() => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const paddedHours = String(hours).padStart(2, '0');
    const paddedMinutes = String(minutes).padStart(2, '0');
    return `${paddedHours}:${paddedMinutes}`;
  }, [dateString]);

  return formattedTime;
};
