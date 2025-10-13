#!/bin/bash

# React 19 Diagnostic Script
# Checks for common React 19 breaking changes in the codebase

echo "🔍 React 19 Migration Diagnostic"
echo "================================"
echo ""

# Check for deprecated string refs
echo "1. Checking for deprecated string refs..."
if grep -r "ref=\"" src/ --include="*.tsx" --include="*.jsx" 2>/dev/null | grep -v "node_modules"; then
    echo "⚠️  Found string refs (deprecated in React 19)"
else
    echo "✅ No string refs found"
fi
echo ""

# Check for deprecated lifecycle methods
echo "2. Checking for deprecated lifecycle methods..."
deprecated_methods=("componentWillMount" "componentWillReceiveProps" "componentWillUpdate" "UNSAFE_componentWillMount" "UNSAFE_componentWillReceiveProps" "UNSAFE_componentWillUpdate")
found_deprecated=false
for method in "${deprecated_methods[@]}"; do
    if grep -r "$method" src/ --include="*.tsx" --include="*.jsx" 2>/dev/null | grep -v "node_modules"; then
        echo "⚠️  Found deprecated method: $method"
        found_deprecated=true
    fi
done
if [ "$found_deprecated" = false ]; then
    echo "✅ No deprecated lifecycle methods found"
fi
echo ""

# Check for legacy context API
echo "3. Checking for legacy context API..."
if grep -r "getChildContext\|childContextTypes\|contextTypes" src/ --include="*.tsx" --include="*.jsx" 2>/dev/null | grep -v "node_modules"; then
    echo "⚠️  Found legacy context API usage"
else
    echo "✅ No legacy context API found"
fi
echo ""

# Check for findDOMNode usage
echo "4. Checking for findDOMNode..."
if grep -r "findDOMNode" src/ --include="*.tsx" --include="*.jsx" 2>/dev/null | grep -v "node_modules"; then
    echo "⚠️  Found findDOMNode usage (deprecated)"
else
    echo "✅ No findDOMNode usage found"
fi
echo ""

# Check for inline style objects that might behave differently
echo "5. Checking React components with inline styles..."
style_count=$(grep -r "style={{" src/ --include="*.tsx" --include="*.jsx" 2>/dev/null | grep -v "node_modules" | wc -l)
echo "📊 Found $style_count instances of inline styles"
if [ "$style_count" -gt 0 ]; then
    echo "💡 Files with inline styles:"
    grep -r "style={{" src/ --include="*.tsx" --include="*.jsx" -l 2>/dev/null | grep -v "node_modules"
fi
echo ""

# List all React component files
echo "6. React components in project..."
echo "📁 TypeScript React files:"
find src/ -name "*.tsx" -type f 2>/dev/null | sort
echo ""

# Check for responsive className usage
echo "7. Checking responsive Tailwind classes..."
responsive_prefixes=("sm:" "md:" "lg:" "xl:" "2xl:")
for prefix in "${responsive_prefixes[@]}"; do
    count=$(grep -r "$prefix" src/ --include="*.tsx" --include="*.astro" 2>/dev/null | grep -v "node_modules" | wc -l)
    echo "📊 $prefix classes: $count instances"
done
echo ""

# Check package versions
echo "8. Current package versions..."
echo "React: $(node -pe "require('./package.json').dependencies.react")"
echo "React-DOM: $(node -pe "require('./package.json').dependencies['react-dom']")"
echo "Three.js: $(node -pe "require('./package.json').dependencies.three")"
echo "Astro: $(node -pe "require('./package.json').dependencies.astro")"
echo "Tailwind: $(node -pe "require('./package.json').dependencies.tailwindcss")"
echo ""

# Check for React 19 specific features that might cause issues
echo "9. Checking for React 19 compatibility..."
if grep -r "useTransition\|useDeferredValue\|useId" src/ --include="*.tsx" --include="*.jsx" 2>/dev/null | grep -v "node_modules"; then
    echo "📊 Found React 18+ concurrent features (verify behavior)"
else
    echo "✅ No concurrent features detected"
fi
echo ""

# TypeScript version check
echo "10. TypeScript configuration..."
echo "TypeScript version: $(node -pe "require('./package.json').devDependencies.typescript")"
echo "React types version: $(node -pe "require('./package.json').devDependencies['@types/react']")"
echo ""

echo "================================"
echo "✅ Diagnostic complete!"
echo ""
echo "Next steps:"
echo "1. Review any ⚠️  warnings above"
echo "2. Test components listed in sections 6-7"
echo "3. Check browser console for React warnings"
echo "4. Test responsive breakpoints manually"
