type UnisenderConfig = {
  apiKey: string;
  fromEmail: string;
  fromName: string;
};

type UnisenderResponse = {
  status?: "success" | "error";
  message?: string;
};

const getUnisenderConfig = (): UnisenderConfig => {
  const apiKey = process.env.UNISENDER_API_KEY;
  const fromEmail = process.env.UNISENDER_FROM_EMAIL;
  const fromName = process.env.UNISENDER_FROM_NAME ?? "Training Plan";

  if (!apiKey || !fromEmail) {
    throw new Error("Unisender config is missing.");
  }

  return { apiKey, fromEmail, fromName };
};

export const sendUnisenderEmail = async (params: {
  toEmail: string;
  toName?: string | null;
  subject: string;
  text: string;
  html?: string;
}) => {
  const config = getUnisenderConfig();

  const to: { email: string; name?: string } = { email: params.toEmail };
  if (params.toName) {
    to.name = params.toName;
  }

  const payload = {
    email: {
      subject: params.subject,
      from_email: config.fromEmail,
      from_name: config.fromName,
      to: [to],
      body: {
        text: params.text,
        ...(params.html ? { html: params.html } : {}),
      },
    },
  };

  const response = await fetch(
    "https://go1.unisender.ru/ru/transactional/api/v1/email/send.json",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": config.apiKey,
      },
      body: JSON.stringify(payload),
    }
  );

  const responseText = await response.text().catch(() => "");
  if (!response.ok) {
    const details = responseText ? ` ${responseText}` : "";
    throw new Error(
      `Unisender send failed: ${response.status} ${response.statusText}${details}`
    );
  }

  if (responseText) {
    const parsed = JSON.parse(responseText) as UnisenderResponse;
    if (parsed.status === "error") {
      throw new Error(`Unisender send failed: ${parsed.message ?? "error"}`);
    }
  }
};
