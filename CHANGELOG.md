# Changelog

## [Unreleased]

### Added

* SECURITY.md, with how to report a security issue privately, what is in scope, and when to expect a reply
* CONTRIBUTING.md, with how to report a problem, how to send a change, and the rules every change follows

## [1.0.0] - 2026-11-08

First release as its own repository, under the MIT License.

### Added

* Lossless metadata removal for JPEG, HEIC, PNG, WebP, MP4, MOV, M4A, MP3, WAV, and FLAC
* Removal of the GPS and sensor tracks that action cameras and drones record, such as GoPro and DJI, blanked in place with no re-muxing
* A report of what each file was carrying, including GPS coordinates
* Whole folders, a zip download with fixed timestamps, and saving straight to a folder in Chrome and Edge
* `metadata-removal-offline.html`, a single file that runs with no internet connection
* A Content Security Policy that blocks every network connection
* Tests for every supported format, run on every push
