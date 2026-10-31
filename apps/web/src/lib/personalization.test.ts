import { describe, expect, it } from "vitest";
import { keyWords, markPersonal, stem, type Piece } from "./personalization";

const SAMPLE = [
  { value: "Алия", hint: "name" },
  { value: "Алматы", hint: "city" },
  { value: "Бусинка", hint: "toy" },
  { value: "рыжий кот Барсик", hint: "pet" },
  { value: "глубоко подышать", hint: "calm" },
];

/** The marked words of a text with their hints. */
const marks = (pieces: Piece[]) => pieces.flatMap((p) => (typeof p === "string" ? [] : [`${p.text}:${p.hint}`]));

describe("stem", () => {
  it("drops an inflecting ending but keeps at least three letters", () => {
    expect(stem("Алия")).toBe("али");
    expect(stem("Бусинка")).toBe("бусинк");
    expect(stem("Барсик")).toBe("барсик");
    expect(stem("зелёный")).toBe("зелен");
    expect(stem("Ян")).toBe("ян");
    expect(stem("Оля")).toBe("оля");
  });
});

describe("keyWords", () => {
  it("prefers a name inside a phrase", () => {
    expect(keyWords("рыжий кот Барсик")).toEqual(["Барсик"]);
    expect(keyWords("подружка Айша")).toEqual(["Айша"]);
  });

  it("otherwise takes the longer words, skipping common ones", () => {
    expect(keyWords("глубоко подышать")).toEqual(["глубоко", "подышать"]);
    expect(keyWords("Когда брат берёт игрушки")).toEqual(["брат", "берёт", "игрушки"]);
    expect(keyWords("Гульнара апай")).toEqual(["Гульнара", "апай"]);
    expect(keyWords("кот")).toEqual(["кот"]);
    expect(keyWords("")).toEqual([]);
  });
});

describe("markPersonal", () => {
  it("finds inflected forms of names, the city, the toy and the pet", () => {
    const pieces = markPersonal("Алии подарили Бусинку, а Барсика оставили в Алматы с Алией.", SAMPLE);
    expect(marks(pieces)).toEqual(["Алии:name", "Бусинку:toy", "Барсика:pet", "Алматы:city", "Алией:name"]);
  });

  it("keeps the text intact around the marks", () => {
    const text = "Страница 1. Алия отправляется в новое приключение в городе Алматы.";
    const pieces = markPersonal(text, SAMPLE);
    expect(pieces.map((p) => (typeof p === "string" ? p : p.text)).join("")).toBe(text);
    expect(pieces[0]).toBe("Страница 1. ");
    expect(pieces.at(-1)).toBe(".");
  });

  it("is case-insensitive and treats ё as е", () => {
    expect(marks(markPersonal("АЛИЯ любит зеленый цвет", [...SAMPLE, { value: "зелёный", hint: "color" }]))).toEqual([
      "АЛИЯ:name",
      "зеленый:color",
    ]);
  });

  it("joins neighbouring words of one answer and leaves unrelated words alone", () => {
    expect(marks(markPersonal("Нужно глубоко подышать, глубоко-глубоко.", SAMPLE))).toEqual([
      "глубоко подышать:calm",
      "глубоко:calm",
      "глубоко:calm",
    ]);
    expect(marks(markPersonal("Алиментный Барсуки Алмазы", SAMPLE))).toEqual([]);
  });

  it("returns the text as is without highlights", () => {
    expect(markPersonal("Просто текст", [])).toEqual(["Просто текст"]);
    expect(markPersonal("", SAMPLE)).toEqual([]);
  });
});
