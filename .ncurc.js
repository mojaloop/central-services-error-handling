module.exports = {
  reject: [
    // npm-check-updates 19.x -> 22.x is a major bump of the dependency-update tooling
    // itself; major releases change CLI/config behaviour. Keep on 19.x for a deliberate
    // upgrade rather than a routine maintenance bump.
    'npm-check-updates',
    // nyc 17.x -> 18.x is a major coverage-tool bump that can change instrumentation and
    // coverage-reporting behaviour (and drops older Node support). Pin to 17.x pending a
    // tested migration.
    'nyc',
    // pre-commit 1.x -> 2.x is a major bump of the git-hook runner; hook wiring/behaviour
    // can change. Keep on 1.x until verified separately.
    'pre-commit',
    // sinon 21.x -> 22.x is a major bump of the test stubbing/mocking library; major
    // releases routinely change/remove APIs and can break the existing unit tests. Pin to
    // 21.x pending a deliberate migration.
    'sinon'
  ]
}
