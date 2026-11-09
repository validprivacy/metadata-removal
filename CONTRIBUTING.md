# Contributing

Bug reports, sample files that break the cleaner, and fixes are welcome.

## Reporting a problem

Open an issue with the browser, the file type, and what went wrong. If metadata survived cleaning, report it privately as described in [SECURITY.md](SECURITY.md) instead.

## Making a change

1. Fork the repository and create a branch
2. Make the change in `src/`. The engine is `src/metadata-removal-engine.js`
3. Run `npm test`. Every test must pass
4. Run `npm run build` and commit the regenerated `metadata-removal-offline.html` along with your change. The tests on every push check that it matches its source
5. Open a pull request that says what changed and why

## Rules for changes

* **No dependencies.** The engine and the page stay zero dependency, so there is nothing to vet or update
* **No network access.** Nothing may load, send, or fetch anything. The Content Security Policy blocks it, and a change that needs it will not be accepted
* **Lossless.** The picture, video, and audio data must come out byte for byte the same. Never re-encode
* **Leave out, never pass through.** A file that cannot be read safely is left out with a reason, never returned unclean
* **A test for every change.** A new format or a fix comes with a fixture in `test/fixtures` and a test that fails without the change
* **No comments in code.** Name things so the code reads on its own
* **Follow the format's published specification.** Cite it in the pull request

## License

By contributing, you agree that your contribution is licensed under the [MIT License](LICENSE).
