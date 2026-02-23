#!/bin/sh
while getopts p: flag
do
    case "${flag}" in
        p) project=${OPTARG};;
    esac
done
echo "Adding noindex to all files in $project..."
# Use find to recursively search for .txt files in the source directory and noindex them
find ~/"$project"/source -type f -name "*.txt" | while read -r file; do
    # Check if the file has a :robots: directive with nosnippet but not noindex
    if grep -q ":robots:.*nosnippet" "$file" && ! grep -q ":robots:.*noindex" "$file"; then
        # Add noindex before nosnippet in the existing directive
        sed -i '' "s/\(:robots:.*\)nosnippet/\1noindex, nosnippet/g" "$file"
    elif ! grep -q ":robots:" "$file"; then
        # No :robots: directive exists, add the full meta block at the beginning
        sed -i '' "1s%^%.. meta::\n   :robots: noindex, nosnippet \n\n%" "$file"
    fi
    # If it already has both noindex and nosnippet, do nothing
done
