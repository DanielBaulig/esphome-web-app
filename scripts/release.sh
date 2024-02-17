#!/bin/bash

if [ -f .script-env ]
then
    set -a            
    source .script-env
    set +a
fi

JSON_PARSE="const json = JSON.parse(require('fs').readFileSync('package.json')); console.log(\`\${json.name} \${json.version}\`);"
read -r NAME VERSION <<< $(node -e "$JSON_PARSE")

echo "Releasing a new version of $NAME"

read -p "Version [$VERSION]: " -r
VERSION=${REPLY:-$VERSION}
VERSION_LABEL="v$VERSION"

echo 
echo "Releasing version $VERSION_LABEL"
read -p "Are you sure? " -n 1 -r
if [[ $REPLY =~ ^[^Yy]?$ ]]
then
  echo
  echo "Aborted."
  exit 1
fi

echo "Working..."

JSON_REPLACE_VERSION="((fs) => fs.writeFileSync('package.json', JSON.stringify({...JSON.parse(fs.readFileSync('package.json')), version: '$VERSION'}, null, 2)))(require('fs'))"
node -e "$JSON_REPLACE_VERSION"
echo "Updated package.json"

git commit --allow-empty -m "Release $VERSION_LABEL"
if [ $? -ne 0 ]; then
  echo "Failed creating release commit. Aborting."
  exit 1
fi
echo "Created release commit"

git tag -a "$VERSION_LABEL" -m "Release $VERSION_LABEL"
if [ $? -ne 0 ]; then
  echo "Failed creating release tag. Aborting."
  exit 1
fi
echo "Created release tag"

git push --follow-tags
if [ $? -ne 0 ]; then
  echo "Failed pushing release commit and tag. Aborting."
  exit 1
fi
echo "Pushed release commit and tag"

gh release create "$VERSION_LABEL" --generate-notes
if [ $? -ne 0 ]; then
  echo "Failed creating Github release. Aborting."
  exit 1
fi
echo "Created Github release"

npm publish
if [ $? -ne 0 ]; then
  echo "Failed publishing package to NPM. Aborting."
  exit 1
fi
echo "Published package to NPM"

echo
echo "Done."
