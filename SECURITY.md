# Security Policy

Metadata Removal runs entirely in the browser, and a file that still carries metadata after cleaning is treated as a security bug. Reports are welcome.

## Supported versions

Fixes go into the latest release, which is what runs at [validprivacy.github.io/metadata-removal.html](https://validprivacy.github.io/metadata-removal.html) and in the newest `metadata-removal-offline.html`. Please check against the latest version before reporting.

## Reporting a vulnerability

Report privately, so a fix can ship before details are public:

* **GitHub:** open the repository's **Security** tab and choose **Report a vulnerability**
* **Email:** byrook@proton.me, with "Metadata Removal security" in the subject

Please include the version, the browser, the steps to reproduce, and a sample file if you can share one safely. For a leak, say which detail survived, such as GPS coordinates, a serial number, or a name.

Please do not open a public issue for a vulnerability.

## What to expect

* An acknowledgement within 7 days
* An assessment, and a fix plan for confirmed issues, within 30 days
* A fix released as soon as it is ready and tested, credited in the CHANGELOG to the reporter who wants credit
* Public details after the fix ships, agreed with the reporter

There is no paid bounty at this time.

## In scope

* Metadata that survives cleaning in a supported format: JPEG, HEIC, PNG, WebP, MP4, MOV, M4A, MP3, WAV, or FLAC
* A file passed through unclean when it should have been left out
* Any way a file, or anything about it, could leave the device
* A crafted file that crashes or hangs the page, or changes the picture, video, or audio data
* A gap in the Content Security Policy on the web page or the offline file

## Out of scope

* What is visible or audible in the content itself, such as faces, signs, or voices
* Formats listed as coming soon, which are left out on purpose
* Separate files that sit next to a video, such as a drone's .SRT file
* The date a computer gives a saved copy
