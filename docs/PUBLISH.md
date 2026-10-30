# Publish the prepared source tree

Run the checks from the repository root:

```bash
node tests/check.cjs
python3 -m unittest discover -s tests -p 'test_*.py'
```

Review the files before staging. `.private/`, `build/`, certificates, credentials, firmware archives and raw blocks must remain excluded. The release includes only a redacted validation summary and native client-buffer screenshots; private diagnostics stay outside the repository.

Create your repository on GitHub, then use its actual URL:

```bash
git init
git add README.md CHANGELOG.md NOTICE.md LICENSE .gitignore .github app dock root theme tools tests docs evidence licenses
git diff --cached --stat
git status --short
git commit -m "Add Q64T Graphite Home and editable Vetro Home panel"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPOSITORY.git
git push -u origin main
```

Do not publish a signed WGT or a certificate generated for your TV. Readers build or sign their own packages when needed. Do not add Samsung theme archives or native assemblies just to make first-install preparation unnecessary.

Suggested repository description:

> Editable compact Home, Graphite theme, persistent root notes and remote customization for Samsung Q64T / Tizen 5.5.

Suggested topics: `samsung-tv`, `tizen`, `tizen-tv`, `q64t`, `vetro`, `home-screen`, `efl`.
