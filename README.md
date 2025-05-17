### Sphere

account abstraction, manage blockchain assets & Web2 secrets. << A Telegram Mini App >>

#### How to run

1. clone repo

```bash
# SSH
git clone git@github.com:stratosphere-network/sphereId.git

# HTTP
git clone https://github.com/stratosphere-network/sphereId.git
```

2. install dependencies

```bash
npm install
```

3. run the app

```bash
# run vite dev server
npm run dev

# download and setup ngrok if not already done
ngrok config add-authtoken 2ZUwOZhdYxRNioP1Lxe5Z0TBYx1_5B6WeduMdSG44NBGuyQuG

# use ngrok
ngrok http --url sphereid.ngrok.app 5173
```

4. head over to telegram [@Botfather](https://t.me/BotFather) and create a bot

5. in botfather, create an app and associate the app you create with the bot you created in step 4

6. when creating the app, you will be required to provide a URL for your app, this URL can be an ngrok url for testing or a link for your deployed web app. use this url > `https://sphereid.ngrok.app`. this url has been whitelisted for CORS and lets you access strato-vault and quvault apis

#### Dependencies

- @telegram-apps/sdk-react: telegram interface
- @mui/material (@emotion/react, @emotion/styled): component library
- @tanstack/react-query: network utility
- date-fns: dates utility
- lightweight-charts: charts library (candlestick, e.t.c)
- lottie-react: lottie animations
- mapbox-gl, react-map-gl: maps utility
- qrcode.react: qr code
- socket.io-client: socket client
- eruda: mobile debug tool
- sass: styles (scss transform to css)

** Please prefer using these dependencies, include additional dependencies only where/when necessary **

#### Style guide

the idea for this guide is to enable us to write self describing code that anyone can instantly be onboarded into and easily know what they are working with.

#### Imports

please prefer to organize imports in this order:

1. react imports
2. external/3rd party dependencies (non-react)
3. custom hooks (if any)
4. utils/helpers
5. components
6. assets (icons/colors/images)
7. styles (prioritize external scss styles over inline styles. use inline styles when necessary)

```tsx
import {} from "react";
import {} from "@telegram-apps/sdk-react";
import {} from "@mui/material";
import {} from "@tanstack/react-query";
import {} from "../hooks";
import {} from "../utils";
import {} from "../components";
import {} from "../assets";
import styles from "../styles";
```

#### Naming

- please prefer self-describing names for everything: variables, folders, files, functions, props, types, interfaces, classnames, ids e.t.c
- avoid spaces in names, if have to be seperated, use an underscore.

```tsx
const Wallet = ({
  ethBalance,
  usdcBalance,
  wberaBalance,
}: props): JSX.Element => {
  const ethBalanceUsd: number = ethBalanlce * ethPrice;
  /** **/

  return {
    /**  **/
  };
};
```

#### Folder structure

- folders should be usedd to organize files appropriately, i.e:

```
|src
  |pages
    -page-a
    |sub-folder
      -page-a

  |components
    -component-a
    |sub-folder
      -component-a

  |hooks
    -hook-a

  |utils
    -util-a
    |sub-folder
      -util-a

  |assets
    |images
    |icons
    |animations

  |styles
    -style-a
    |sub-folder

  |some-other-directory
```

#### Pages

- react does not have a concept of pages and components but we can make it aware that certain components should be traeated as pages and other components as 'components' that build up a page.
- Components that are pages can be identified by using those 'components' as Routes.
- page components should have a default export, i.e:

```tsx
export default function Page() {
  /** **/
}
```

- page components should be created as a section, i.e:

```tsx
export default function Page() {
  return <section id="section-id"> {/** **/} </section>;
}
```

#### Components

- components should be created as arrow functions, to create distinction between pages & components that build up pages
- components should be named exports

```tsx
export const Component = (): JSX.Element => {
  return {
    /** **/
  };
};
```

- components should also be created as div-s

```tsx
export const Component = (): JSX.Element => {
  return <div id="div-id"> {/** **/} </div>;
};
```

#### Styles

- please prefer to use scss over css and/or tailwind
- scss is a powerful tool, it offers mixins(i.e. functions), operations, logic, nested styling, inheritance
- scss also includes warnings for code that might break in future with a css update
- please don't break scss rules
- for dimensions, prioritize relative units (rem, em, %), not px
- tailwind is not prefreed because we want clean html, a good seperation of concerns as well as design freedom

```scss
// scss nesting
.navbar {
  width: calc(100vw - 4rem);

  .lo1 {
    .item {
      .icon {
        /** **/
      }

      span {
        /** **/
      }
    }
  }

  .lo2 {
    /** **/
  }
}
```

```scss
// scss mixins
// mixins are reusable just like functions in JS

@mixin somemixin($variable1, $variable2) {
  background-color: $variable1;
}
```

```scss
// scss inheritance
.submit {
  /** **/
  background-color: colors.$success;
}

.cancel {
  @extend .submit;
  background-color: colors.$danger;
}
```

```html
<!-- with scss ✅ -->
<button className="submit">Submit</button>

<!-- with tailwind ❌ -->
<button
  className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
>
  Submit
</button>
```

- for colors, please prefer to use rgba colors over hex:

```scss
// colors ✅
$success: rgba(15, 177, 77, 1);

// colors ❌
$success: #0fb14d;
```

- please don't use tailwind

#### Queries & Mutations

- queries always come before mutations

```tsx
import { useQuery, useMutation } from "@tanstack-react-query";

const { data } = useQuery();
const { mutate, data } = useMutation();
```

#### Comments

- please use comments sparingly, where necessary
- do not leave comments in markup, markup should be self describing

#### Commits

- please try and use meaningfull commit messages that indicate what change(s) the commit is about

** please make sure to run `npm run build` everytime before pushing your changes, if this throws an error or warning make sure to fix it because that deployment will fail **

To learn more about sphere, please checkout [SPHERE.md](./SPHERE.md), [PAPER.md](./PAPER.md) and try [the miniapp](https://t.me/sphere_id_bot/sphere).
