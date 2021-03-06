import { ON_FLAG, OFF_FLAG, BASE_URL, TRUE_FLAG, FALSE_FLAG } from "./base-constants";

class Features {
  constructor(flags, user, apiKey) {
    this.user = user;
    this.apiKey = apiKey;
    this.flags = flags;

    this.enabledMap = {};
    if (Array.isArray(flags)) {
      this.enabledMap = flags.reduce((acc, nxt) => {
        const isBoolFlag = [ON_FLAG, OFF_FLAG, TRUE_FLAG, FALSE_FLAG].includes(nxt.variation.name);
        if (isBoolFlag) {
          const evalStatus =
            (nxt.flag.enabled && [ON_FLAG, TRUE_FLAG].includes(nxt.variation.name)) || false;
          acc[nxt.flag.key] = evalStatus;
        }
        return acc;
      }, {});
      console.log({ thisEnabledMap: this.enabledMap });
    }
  }

  isEnabled(key) {
    const result = this.enabledMap[key];
    this.flagEvaluated(key);
    return Boolean(result); // in case bad key is sent
  }

  getFlagVariation(key) {
    const flag = this.flags.find(({ flag }) => flag.key === key);
    if (flag) {
      return flag.variation.name;
    }
    return null;
  }

  flagEvaluated(flagKey) {
    const flageval = this.flags.find(({ flag }) => flag.key === flagKey);
    const recordUrl = `${BASE_URL}record/${this.apiKey}`;
    const body = JSON.stringify(flageval);

    fetch(recordUrl, { body, method: "POST" })
      .then(() => {})
      .catch((err) => console.error(err));
  }
}

async function initializeClient(apiKey, user) {
  const flagsUrl = `${BASE_URL}flags/${apiKey}`;
  const body = JSON.stringify({ user: user });
  let flags;
  try {
    const res = await fetch(flagsUrl, { body, method: "POST" });
    if (res.status === 400) {
      console.error("invalid feature flag api key, setting all flags to off");
      flags = null;
    } else {
      flags = await res.json();
    }
  } catch (err) {
    console.error("error fetching feature flags", err);
    console.error("features will all evaluate to default");
    flags = null;
  }
  return new Features(flags, user, apiKey);
}

export default {
  initializeClient,
};
