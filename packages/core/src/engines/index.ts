/**
 * Pure, DOM-free state machines fed by venue events. Internal to
 * @perpetua/core — actions instantiate and share them; never imported by
 * consumers, and not exported from the package root (CORE_SPEC.md §5.6, §5.5).
 */
export * from "./book-engine.js";
export * from "./blotter-engine.js";
export * from "./candle-stitcher.js";
