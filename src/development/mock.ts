import { mockTelegramEnv } from "@telegram-apps/sdk";

const TEST_TELEGRAM_ID = import.meta.env.VITE_TEST_TELEGRAM_ID ?? "5654841892";

export function enableTelegramMock() {
  // !!! IMPORTANT: AT THE MOMENT THIS IS A FAKE TEST ACCOUNT WITH A FAKE TELEGRAM ID, the other info though is based on an actual account
  mockTelegramEnv({
    launchParams: `tgWebAppData=user%3D%257B%2522id%2522%253A${TEST_TELEGRAM_ID}%252C%2522first_name%2522%253A%2522%25F0%259F%2592%25B2BLM%2522%252C%2522last_name%2522%253A%2522%2522%252C%2522username%2522%253A%2522Tapless5%2522%252C%2522language_code%2522%253A%2522en%2522%252C%2522allows_write_to_pm%2522%253Atrue%252C%2522photo_url%2522%253A%2522https%253A%255C%252F%255C%252Ft.me%255C%252Fi%255C%252Fuserpic%255C%252F320%255C%252FglU5Uto2iTHwSDLj7qec6vBfwAIYJF5TLqtdUQWKSu4PENX7QjphEZK_fksVFBMN.svg%2522%257D%26chat_instance%3D4774765322954839702%26chat_type%3Dsender%26auth_date%3D1747375553%26signature%3DRdfFp6vHrWzKyYaVBHDIsEOU9Txx-r-XFDxhbmxA-vJJJ51Eu8KtvWXEeTuJUL-z7CIxUqIycZxf_YZUEvJ0Cg%26hash%3D6a64fb9969577de200385f77533a58cf0b5aa7e192fc9b889e867dda4cf28556&tgWebAppVersion=9.0&tgWebAppPlatform=android&tgWebAppThemeParams=%7B%22bg_color%22%3A%22%23ffffff%22%2C%22section_bg_color%22%3A%22%23ffffff%22%2C%22secondary_bg_color%22%3A%22%23f0f0f0%22%2C%22text_color%22%3A%22%23222222%22%2C%22hint_color%22%3A%22%23a8a8a8%22%2C%22link_color%22%3A%22%232678b6%22%2C%22button_color%22%3A%22%2350a8eb%22%2C%22button_text_color%22%3A%22%23ffffff%22%2C%22header_bg_color%22%3A%22%23527da3%22%2C%22accent_text_color%22%3A%22%231c93e3%22%2C%22section_header_text_color%22%3A%22%233a95d5%22%2C%22subtitle_text_color%22%3A%22%2382868a%22%2C%22destructive_text_color%22%3A%22%23cc2929%22%2C%22section_separator_color%22%3A%22%23d9d9d9%22%2C%22bottom_bar_bg_color%22%3A%22%23f0f0f0%22%7D`,
    onEvent(event, next) {
      next();
    },
  });
}
