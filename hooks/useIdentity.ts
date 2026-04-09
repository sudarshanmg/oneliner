"use client";

import { useEffect, useState } from "react";
import { generateToken, deriveFantasyName, generateIdenticon } from "@/lib/identity";

export type Identity = {
  token: string;
  name: string;
  identicon: string;
};

const STORAGE_KEY = "ommo_token";

export function useIdentity(): Identity | null {
  const [identity, setIdentity] = useState<Identity | null>(null);

  useEffect(() => {
    let token = localStorage.getItem(STORAGE_KEY);
    if (!token) {
      token = generateToken();
      localStorage.setItem(STORAGE_KEY, token);
    }
    setIdentity({
      token,
      name: deriveFantasyName(token),
      identicon: generateIdenticon(token),
    });
  }, []);

  return identity;
}
