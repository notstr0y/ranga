# Contributing

Thanks for helping improve Ranga.

## Making changes

1. Fork the repository and create a branch for your change.
2. Keep the change small and focused on one thing.
3. Follow the style of the surrounding code.

## Testing

Before submitting, make sure these pass (see [DEVELOPMENT.md](DEVELOPMENT.md)):

```
npm run lint
npx tsc -b
npm test
npm run test:upload
```

## Submitting

Open a pull request against `master` describing what changed and why. Link a related issue if there is one.

## Security

Never commit credentials or `.env.local`. If you find a security problem, report it privately to the maintainer instead of opening a public issue.

## Resources

Uploading study material through the app is not open to the public yet.

## License

By contributing, you agree that your contribution is licensed under the MIT License.
