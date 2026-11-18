# Gemini Clone

## Run the app

1. Install Node.js, then run `npm install` in this folder.
2. Create a `.env` file in this folder and add your Google AI Studio API key:

   ```text
   EXPO_PUBLIC_GEMINI_API_KEY=your_api_key
   ```

   The existing `.env.example` shows the required variable name.
3. Run `npm start` and open the project in Expo Go, or run `npm run android` with an Android emulator or device connected.

Restart Expo after changing `.env` so the new value is loaded.

Use the **Light** / **Dark** button in the header to switch themes.

## API key safety

Expo embeds `EXPO_PUBLIC_` values in the app bundle. Do not use this client-side setup for a public production app; put Gemini requests behind a server you control and keep the API key there. Do not commit `.env` or share its contents.
