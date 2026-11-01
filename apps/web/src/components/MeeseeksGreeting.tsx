import { useState } from "react";

import { pickMeeseeksGreeting } from "../meeseeksCopy";

export function MeeseeksGreeting() {
  const [greeting] = useState(pickMeeseeksGreeting);
  return greeting;
}
