# tapstep notes (dogfooding)

Things noticed while using tapstep on WishBook. Version: 0.13.11.

1. **`--config` with `flows:` still requires a `<FLOW>` argument.** The docs say the `flows:`
   globs replace the directory argument, but `tapstep test --config e2e/config.yaml` fails with
   "the following required arguments were not provided: <FLOW>". Workaround: pass `e2e/flows`.
2. **`-v` on a directory run prints no per-step lines.** Only `environment`, `driver` and the
   report path appear; the per-step ✓/✗ promised by `--verbose` is missing. The JSON report has
   the steps.
3. **Viewport warning in a headless run:** "the browser window could not grow to the 1280x800
   viewport (screen too small?)" shows on a MacBook screen even though the run is headless.
