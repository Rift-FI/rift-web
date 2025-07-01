# Start here.

Take out 30 minutes of your time to read, u'll be in the codebase for a while, so it's worth it.

- [Atomic Design](https://atomicdesign.bradfrost.com/table-of-contents/)
- [Headless UI](https://www.merrickchristensen.com/articles/headless-user-interface-components)

### 1. Use tailwind utilities and follow the Atomic Design principles

### 2. Co-location

Functionality, styling(of which there are no styling files as you will be using tailwind) and markup should be co-located. This means that all related files should be in the same folder.
There's a difference between jamming everything into a single file and co-locating files. Co-locating files means that you should have a folder for each feature, and inside that folder, you should have all the files related to that feature. This includes the component file and it's related functionality. This makes it easy to find all the files related to a specific feature and makes it easy to move features around if needed.

### 3. Where do my components go?

There's a difference between a reusable component that'll be used as a utility for a specific action across features, and a component that is only used once for a specific feature. Utility components should be placed under the `components/` folder while feature-specific components should be placed under the `features/` folder.

### 4. I want to add a utility component

Grab it from shadcn/ui.
Once you have it customize it to fit our theme.

### 5. Branching rules

Every branch name must correspond to an issue ID on Linear.

Once an issue is created on Linear, copy the issue ID and use it as the branch name when creating your branch.

After implementing your changes and ensuring everything builds correctly locally, create a pull request against the preview branch.

Once merged, your changes will be available on the preview app.

From there, they will be merged into staging, and eventually into master.

⚠️ Branching rules and pull request rules are non-negotiable.
