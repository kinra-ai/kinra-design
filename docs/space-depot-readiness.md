# Public distribution through the Space/Depot move

Prepared 2026-09-16. GitHub remains canonical until the verified portfolio
cutover receipt appoints private Depot. The public destination remains
`github.com/kinra-ai/kinra-design`: consumers retain anonymous public source
and package access, exact Git/codeload URLs and lockfile integrity. No npm
registry publication is appointed. Public fork/bot PRs remain incoming work
for Depot's reviewed Change path, never a second direct canonical publisher.

## Preserved release objects

| Tag      | Original annotated object                  | Peeled commit                              | Pack files |
| -------- | ------------------------------------------ | ------------------------------------------ | ---------- |
| `v0.1.0` | `288728b8d668ef4daaa90f12f1508949b53a2815` | `7a367ace117747619c02b1dd61fa863bc92ca12b` | 14         |
| `v0.2.0` | `f198e26c74b117e2c9917ea01be08543cbbc8a03` | `2117d06baab9c7905fb5cdfcaeac430c0ef66de2` | 21         |

Both tags' package versions match their identities. Read-only `npm pack
--dry-run --json` on disposable exact Git archives contains only the approved
distributable source, assets, guides and package metadata, with no example,
tooling or dependency tree. Both avoid Git-install lifecycle build hooks.
No tag or package bytes were changed and no release command ran.

## Exact current consumers

Site and Gateway retain public codeload commit
`21327ae489243316988019e6b6ca9a7737982699`; Depot's vendored manifest names the
same exact revision. Space retains Git dependency
`36b9340061fb7da32b8ed3b62dfebc13ff533cf5`. Their package and lock identities
agree and all installed style/asset files match the selected Git source.
Kin and Scope's recorded exact brand-asset source stays `21327ae`. Retired
consumer pins are retained provenance, not migration candidates.

The native local package proof is `/tmp/design-move-distribution-proof.json`
and `/tmp/design-move-distribution.log`. Existing Site, Gateway, Space and
Depot owning gates qualify their actual consuming builds. The local proof
does not claim a future public GitHub mirror has already been populated.

## Held execution and checks

Cutover must preserve both tag objects, peeled commits, all exact consumer
commits and original annotation bytes. Once approved, public read verification
must compare `git ls-remote` tag objects/peeled commits and resolve current
Git/codeload dependencies at those same identities. This is part of the
portfolio mirror execution proof; a passing local package check cannot replace
it. Changes to URLs, tags, release identity or consumer adoption require their
separate owner decisions. No credential should be needed by public consumers.

This owner change updates guidance only. `npm run check` is the required
documentation gate; its result is recorded in the owning status and handoff.
No workflow exists here to retarget; ordinary future validation must bind its
actual candidate head and remain available for retained incoming PRs.
