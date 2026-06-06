export type TimezoneSelectOption = {
  value: string;
  label: string;
};

type TimezoneDescriptor = {
  value: string;
  city: string;
};

export const DEFAULT_TIMEZONE = "Europe/Moscow";

const RUSSIAN_TIMEZONES: TimezoneDescriptor[] = [
  {
    value: "Europe/Kaliningrad",
    city: "Калининград",
  },
  {
    value: "Europe/Moscow",
    city: "Москва",
  },
  {
    value: "Europe/Samara",
    city: "Самара",
  },
  {
    value: "Asia/Yekaterinburg",
    city: "Екатеринбург",
  },
  {
    value: "Asia/Omsk",
    city: "Омск",
  },
  {
    value: "Asia/Krasnoyarsk",
    city: "Красноярск",
  },
  {
    value: "Asia/Irkutsk",
    city: "Иркутск",
  },
  {
    value: "Asia/Yakutsk",
    city: "Якутск",
  },
  {
    value: "Asia/Vladivostok",
    city: "Владивосток",
  },
  {
    value: "Asia/Magadan",
    city: "Магадан",
  },
  {
    value: "Asia/Kamchatka",
    city: "Петропавловск-Камчатский",
  },
];

function normalizeSearchValue(value: string) {
  return value.toLocaleLowerCase("ru-RU").replace(/ё/g, "е");
}

function formatTimezoneOffset(timeZone: string, date: Date) {
  try {
    const offset =
      new Intl.DateTimeFormat("en-US", {
        timeZone,
        timeZoneName: "longOffset",
      })
        .formatToParts(date)
        .find((part) => part.type === "timeZoneName")?.value ?? "";

    if (offset === "GMT") {
      return "UTC+00:00";
    }

    return offset.replace(/^GMT/, "UTC");
  } catch {
    return "";
  }
}

function createRussianTimezoneOption(
  descriptor: TimezoneDescriptor,
  date: Date
): TimezoneSelectOption {
  const offset = formatTimezoneOffset(descriptor.value, date);
  const suffix = offset ? ` (${offset})` : "";

  return {
    value: descriptor.value,
    label: `${descriptor.city} — ${descriptor.value}${suffix}`,
  };
}

function createTimezoneOption(timeZone: string, date: Date): TimezoneSelectOption {
  const offset = formatTimezoneOffset(timeZone, date);
  const suffix = offset ? ` (${offset})` : "";

  return {
    value: timeZone,
    label: `${timeZone}${suffix}`,
  };
}

export function buildTimezoneOptions(date = new Date(), includeTimeZones: string[] = []) {
  const russianOptions = RUSSIAN_TIMEZONES.map((descriptor) =>
    createRussianTimezoneOption(descriptor, date)
  );
  const seen = new Set(russianOptions.map((option) => option.value));

  const extraOptions = includeTimeZones
    .filter((timeZone) => timeZone && !seen.has(timeZone))
    .map((timeZone) => {
      seen.add(timeZone);
      return createTimezoneOption(timeZone, date);
    });

  return [...russianOptions, ...extraOptions];
}

function getRussianTimezoneSearchText(timeZone: string) {
  const descriptor = RUSSIAN_TIMEZONES.find((item) => item.value === timeZone);
  if (!descriptor) {
    return "";
  }

  return descriptor.city;
}

export function filterTimezoneOption(
  input: string,
  option?: { label?: unknown; value?: unknown } | null
) {
  const query = normalizeSearchValue(input.trim());
  if (!query) {
    return true;
  }

  const searchText = [
    typeof option?.label === "string" ? option.label : "",
    typeof option?.value === "string" ? option.value : "",
    typeof option?.value === "string" ? getRussianTimezoneSearchText(option.value) : "",
  ].join(" ");

  return normalizeSearchValue(searchText).includes(query);
}
