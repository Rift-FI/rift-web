import { format, formatDistance } from "date-fns";
import { enGB } from "date-fns/locale";

export const formatDateToStr = (
  dateStr: string,
  includesTime?: boolean
): string => {
  return includesTime
    ? format(new Date(dateStr as string), "eee MMM do y h:m a")
    : format(new Date(dateStr as string), "eee MMM do y");
};

export const dateDistance = (prevDateStr: string): string => {
  const currDate = new Date();
  const prevDate = new Date(prevDateStr);

  const formatteddiff = formatDistance(prevDate, currDate, {
    addSuffix: true,
    locale: enGB,
  });
  return formatteddiff;
};

// Function to format seconds into hours, minutes, seconds
export const formatSeconds = (totalSeconds: number): string => {
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    return "0s";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  let result = "";
  if (hours > 0) {
    result += `${hours}h `;
  }
  if (minutes > 0 || hours > 0) {
    // Show minutes if hours are present or minutes > 0
    result += `${minutes}m `;
  }
  result += `${seconds}s`;

  return result.trim(); // Trim trailing space if only hours/minutes shown
};
