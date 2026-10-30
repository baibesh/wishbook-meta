import { describe, expect, it } from "vitest";
import {
  ChildProfileSchema,
  CreateBookSchema,
  METHODOLOGIES,
  ageBand,
  defaultMethodology,
  fitsAge,
  CreateOrderSchema,
  StorySchema,
  orderPrice,
  orderStatusAt,
  progressFor,
} from "./index";

describe("ChildProfileSchema", () => {
  it("defaults the language to Russian and coerces age", () => {
    const child = ChildProfileSchema.parse({
      name: "Айгерим",
      age: "6",
      gender: "girl",
      interests: ["космос"],
      city: "Алматы",
    });
    expect(child.language).toBe("ru");
    expect(child.age).toBe(6);
  });

  it("rejects an empty interest list", () => {
    expect(
      ChildProfileSchema.safeParse({ name: "A", age: 5, gender: "boy", interests: [], city: "X" }).success,
    ).toBe(false);
  });
});

describe("StorySchema", () => {
  it("requires at least one page", () => {
    expect(StorySchema.safeParse({ title: "T", hero_description: "H", pages: [] }).success).toBe(false);
  });
});

describe("progressFor", () => {
  it("moves through the pages stage proportionally", () => {
    expect(progressFor("pages", 0, 10)).toBe(30);
    expect(progressFor("pages", 5, 10)).toBe(60);
    expect(progressFor("done")).toBe(100);
  });
});

describe("orders", () => {
  it("prices delivery by city", () => {
    expect(orderPrice("hard", 2, "Алматы")).toEqual({ books: 29800, delivery: 0, total: 29800 });
    expect(orderPrice("soft", 1, "Шымкент")).toEqual({ books: 9900, delivery: 1500, total: 11400 });
  });

  it("normalizes Kazakh phone numbers", () => {
    const order = CreateOrderSchema.parse({
      bookId: "b",
      recipientName: "Айгерим",
      phone: "+7 (701) 123-45-67",
      city: "Алматы",
      address: "ул. Абая, 1",
      cover: "soft",
      quantity: "1",
    });
    expect(order.phone).toBe("+77011234567");
    expect(CreateOrderSchema.shape.phone.safeParse("8701").success).toBe(false);
  });

  it("walks the order through its stages", () => {
    expect(orderStatusAt(0, 1000)).toBe("paid");
    expect(orderStatusAt(2500, 1000)).toBe("shipped");
    expect(orderStatusAt(99_000, 1000)).toBe("delivered");
  });
});

describe("methodologies", () => {
  const child = { name: "Арман", age: 3, gender: "boy", interests: ["машинки"], city: "Астана" };

  it("covers every age from 2 to 10 with a default that fits", () => {
    for (let age = 2; age <= 10; age++) {
      expect(fitsAge(defaultMethodology(age), age)).toBe(true);
      expect(ageBand(age).ageMin).toBeLessThanOrEqual(age);
    }
  });

  it("has unique slugs and at least three beats each", () => {
    expect(new Set(METHODOLOGIES.map((m) => m.slug)).size).toBe(METHODOLOGIES.length);
    for (const m of METHODOLOGIES) expect(m.structure.length).toBeGreaterThanOrEqual(3);
  });

  it("rejects a method meant for older children", () => {
    const result = CreateBookSchema.safeParse({ child, methodology: "growth-mindset" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["methodology"]);
  });

  it("accepts a fitting method with a theme", () => {
    const result = CreateBookSchema.parse({
      child,
      methodology: "social-story",
      theme: "первый день в детском саду",
    });
    expect(result.methodology).toBe("social-story");
  });
});
