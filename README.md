# NoOwe

A free, open-source bill splitting app with bill scanning via OCR.

**Landing Page:** https://nooweapp.pages.dev/

## Our Vision

NoOwe is a cutting edge OCR backed bill-splitting application, built to make cost-sharing simple. It is completely free and open source, hosted via GitHub to allow users to report issues and add and suggest new features. For maximal security, the application features a serverless backend, allowing for all personal information to remain local.

## Features

- Scan bills using your camera
- Manually edit line items
- Import/manually add contacts
- Assign items to each contact
- Sends a generated message to each contact with their split and your preferred payment method

## Tech Stack

- **Framework:** React Native + Expo
- **Navigation:** Expo Router
- **No Backend:** fully client-side
- **Platforms:** iOS

## Getting Started

### Prerequisites

- Node.js >= 18
- iOS 15.5+ (for native iOS build)

### First-Time Setup

```bash
git clone https://github.com/ananyashri/NoOwe.git
cd NoOwe
npm install
npx expo prebuild
# plug your iPhone into your computer, make sure it has developer mode enabled (Settings > Privacy & Security > Developer Mode)
npx expo run:ios --device
```

> Requires Xcode and an Apple ID. On first launch, go to **Settings → General → VPN & Device Management** and trust the developer certificate.

### After Initial Setup

```bash
npx expo start --dev-client
```

> Use `--tunnel` to bypass network restrictions if needed.

## Contributing

This project is open source, and contributions are welcome!

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make changes
4. Commit your changes (`git commit -m 'Add your feature'`)
5. Push to the branch (`git push origin feature/your-feature`)
6. Open a Pull Request

## Maintainers

- [Owen Ungaro](https://github.com/owenungaro)
- [Arjun Gore](https://github.com/arjuncgore)
- [Aditya Kumaran](https://github.com/adikumaran)
- [Jacob Choi](https://github.com/JacobChoi5)
- [Ananya Shrivastava](https://github.com/ananyashri)
- [George Oliynyk](https://github.com/TheDarkElites)

## License

[GNU GENERAL PUBLIC LICENSE](./LICENSE)

## Acknowledgements

- Built as a Senior Design Project at Stevens Institute of Technology
- Under the guidance of professors Patrick Hill and Matthew Wade
