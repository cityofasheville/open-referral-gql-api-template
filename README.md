# open-referral-gql-api
GraphQL API and DB creation for the open referral standard

# Installation
Clone this repo, then run `yarn` and `yarn start`. The API will be at http://localhost:4000/graphql.

# Modifications and Extensions to the Open Referral Standard

1. Added an `alternate_name` column to `taxonomies`. I've used `alternate_name` in `locations`, for example, as the display name, with the regular name operating as the shorter version that can be used in code.
2. Added `type` and `parent_location` to the `locations` table. That allows us to distinguish county, state and other jurisdictions and encode their relationships. We need this because for the reentry site we're not tracking the actual physical locations of resources - we assume that we're linking to a site that gives that. We're using the location to indicate jurisdiction (county).



