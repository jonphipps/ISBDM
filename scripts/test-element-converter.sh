#!/bin/bash

# Test the element converter on a single file
yarn convert-element /Users/jonphipps/Code/ISBDM/ISBDM/docs/statements/1025.html /Users/jonphipps/Code/ISBDM/docs/statements/test-1025.mdx

# Compare with the existing conversion
echo "Comparing test conversion with existing conversion..."
diff /Users/jonphipps/Code/ISBDM/docs/statements/test-1025.mdx /Users/jonphipps/Code/ISBDM/docs/statements/converted-1025.mdx