import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { exigirBancoLocal } from "./bancada";

/**
 * Antes de qualquer teste: conferir que o banco é o local.
 *
 * Roda aqui e no `globalSetup` (`reseed.ts`) de propósito — o primeiro que
 * executar barra, e nenhum dos dois depende do outro existir.
 */
exigirBancoLocal();

afterEach(() => {
  cleanup();
});
