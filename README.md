## V2 dev Guidlines.

# Start here
Take out 30 minutes of your time to read, u'll be in the codebase for a while, so it's worth it.
- [Atomic Design](https://atomicdesign.bradfrost.com/table-of-contents/)
- [Headless UI](https://www.merrickchristensen.com/articles/headless-user-interface-components)

### 1. Only use tailwind utilities and follow the Atomic Design principles
### 2. Co-location, co-location, co-location
Functionality, styling(of which there are no styling files as you will be using tailwind) and markup should be co-located. This means that all related files should be in the same folder. 
There's a difference between jamming everything into a single file and co-locating files. Co-locating files means that you should have a folder for each feature, and inside that folder, you should have all the files related to that feature. This includes the component file and it's related functionality. This makes it easy to find all the files related to a specific feature and makes it easy to move features around if needed.
### 3. Where do my components go?
There's a difference between a reusable component that'll be used as a utility for a specific action across features, and a component that is only used once for a specific feature. Utility components should be placed under the `components/` folder while feature-specific components should be placed under the `features/` folder.
### 4. I want to add a utility component
Great! then grab it from shadcn/ui and there alone. 
Once you have it customize it to fit our theme.
