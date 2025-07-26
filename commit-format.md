# Please follow the `commitlint` convention for better commit messages

## The format we are using

`type(scope): message`

Example: `feat(lang): add Polish language support`

## The `types` are as follows

- `build`: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
- `ci`: Changes to CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
- `chore`: Changes which don't change source code or tests, e.g., changes to the build process, auxiliary tools, and libraries
- `docs`: Documentation only changes
- `feat`: A new feature
- `fix`: A bug fix
- `perf`: A code change that improves performance
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `revert`: Revert something
- `style`: Changes that do not affect the meaning of the code (white space, formatting, missing semi-colons, etc)
- `test`: Adding missing tests or correcting existing tests

### Examples using type

- `build: update npm dependency`
- `ci: add circleci configuration file`
- `docs: fix typo in foo.md and bar.md`
- `perf: optimize database query for faster response times`
- `feat: allow provided config object to extend other configs`
- `fix: resolve issue with incorrect data rendering`
- `refactor: reorganize code structure for better readability`
- `style: format code according to Prettier standards`
- `test: add unit tests for user authentication`

## The `scopes` are as follows:

The standard defines the use of an optional scope, which is used in addition to the required type.

An optional scope MAY be provided after a type.

Strongly recommend adding a scope for each commit.

A scope is a phrase describing a section of the codebase enclosed in parenthesis '()'.

e.g., `fix(parser):` This would be specific to a particular project, so you cannot know the general scopes for all projects. The standard says you should agree with your team on what the scope would be. Perhaps based on features, projects, or directories.

### Examples using scope

- `build(deps): upgrade packages`
- `style(deps): remove whitespace in requirements.txt`
- `feat(lang): add Polish language`
