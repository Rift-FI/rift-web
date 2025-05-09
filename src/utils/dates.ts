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
