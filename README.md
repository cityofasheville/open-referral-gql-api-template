# open-referral-gql-api
This is the starter template for building GraphQL APIs based on the [open referral standard](https://openreferral.readthedocs.io/en/latest/hsds/reference/). It contains the basic functionality of a GraphQL API, and will soon be updated to include authentication, logging, caching, and administration. It is intended to be paired with a front-end application that makes use of the GraphQL API.

## Modifications and Extensions to the Open Referral Standard

1. Added an `alternate_name` column to `taxonomies`. I've used `alternate_name` in `locations`, for example, as the display name, with the regular name operating as the shorter version that can be used in code.
2. Added `type` and `parent_location` to the `locations` table. That allows us to distinguish county, state and other jurisdictions and encode their relationships. We need this because for the reentry site we're not tracking the actual physical locations of resources - we assume that we're linking to a site that gives that. We're using the location to indicate jurisdiction (county).

# How To Use This Template

To create a new API that derives from this one, create the new repo (e.g., NEW-REPO) and then:

````
git clone  https://github.com/cityofasheville/open-referral-gql-api NEW-REPO
cd NEW-REPO  
git remote set-url origin https://github.com/cityofasheville/NEW-REPO
git remote add upstream https://github.com/cityofasheville/open-referral-gql-api
git push origin master
````

Updates to the template can be pulled from the upstream repository. If you are outside the City of Asheville organization, then you can just fork.

To build the API, run:
````
yarn
yarn start
````
Application-specific API code should all be added in the ```api``` subdirectory.




