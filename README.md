# Nextapm

Monitoring solution for nodejs serverless applications. currently supported following platforms.

* Firebase cloud functions.
* Vercel Nextjs application.
* Vercel Serverless API.

# Installation
```
npm i nextapm
```

# Firebase Configuration Steps
Include the following snippets in main file of cloud funtions.
```
// this should be in the first line
import { config, setFunctionName } from 'nextapm'; 
... your app imports ...
          
config({
  licenseKey: '<licenseKey>',
  projectId: '<projectId>',
});
        
...your cloud functions...
functions.firestore.document(path).onWrite(async () => {
  setFunctionName('<function-name>'); // call in all cloud functions callback
  ....function logic....
})
```

# Vercel Nextjs Configuration Steps
Include the following snippets in `pages/_app.js` file
```
import { monitorNextApp } from 'nextapm'; // should be in first line
... your app imports...

function MyApp({ Component, pageProps }) {
  ... your app code ...
}

MyApp.getInitialProps = async (context) => {
  monitorNextApp(context); // should be in the first line in this method
  ...your app code and return props or {}...
}

export default MyApp
```
# Vercel Serverless API
Wrap actual serverless API handler in following way for all API's.
```
import { monitorServerlessApi } from 'nextapm'; // should be in first line
... you imports...

module.exports = monitorServerlessApi((req, res) => {
  ... your api code ...
})
```

# Exception tracking
Use following agent API to track exceptions
```
import { trackErr } from 'nextapm';

try {
  ... your app code .. 
} catch (err) {
  trackErr(err);
}
```
# Evnironment variables
Configure following environment values in vercel, you can get it from [https://app.nextapm.dev](https://app.nextapm.dev) after creating monitor.
NEXTAPM_LICENSE_KEY
NEXTAPM_PROJECT_ID

# Restart/ Redeploy
Finally restart/redeploy the application and perform transaction and check metrics in [https://app.nextapm.dev](https://app.nextapm.dev) dashboard.