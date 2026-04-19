export type AliceWeightPeriod = "morning" | "evening";

export type AliceLinkedUser = {
  userId: number;
  timezone: string;
};

export type AliceWeightCommand = {
  weight: number;
  period: AliceWeightPeriod;
};

export type AliceRequest = {
  meta: {
    client_id: string;
    locale: string;
    timezone: string;
  };
  session: {
    message_id: number;
    session_id: string;
    skill_id: string;
    user: {
      user_id: string;
    };
    new: boolean;
  };
  request: {
    command: string;
    original_utterance: string;
    nlu: {
      tokens: string[];
      entities: any[];
      intents: Record<string, any>;
    };
  };
  state?: {
    session?: {
      expected_period?: AliceWeightPeriod;
    };
  };
  version: string;
};

export type AliceResponse = {
  version: string;
  response: {
    text: string;
    end_session: boolean;
  };
  session_state?: {
    expected_period?: AliceWeightPeriod;
  };
};

export type AliceSessionData = {
  expectedPeriod?: AliceWeightPeriod;
};
