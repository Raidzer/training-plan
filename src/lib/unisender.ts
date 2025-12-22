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

  const recipient: { email: string; substitutions?: { to_name: string } } = {
    email: params.toEmail,
  };
  if (params.toName) {
    recipient.substitutions = { to_name: params.toName };
  }

  const payload = {
    message: {
      recipients: [recipient],
      subject: params.subject,
      from_email: config.fromEmail,
      from_name: config.fromName,
      body: {
        plaintext: params.text,
        ...(params.html ? { html: params.html } : {}),
      },
    },
  };
  
  const response = await fetch(
    "https://go2.unisender.ru/ru/transactional/api/v1/email/send.json",
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
