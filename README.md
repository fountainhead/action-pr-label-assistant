<p align="center">
  <a href="https://github.com/fountainhead/action-pr-label-assistant/actions"><img alt="typescript-action status" src="https://github.com/fountainhead/action-pr-label-assistant/workflows/build-test/badge.svg"></a>
</p>

# GitHub Action: PR Label Assistant

A GitHub Action that allows you to provide guidance to users on what labels they can/should apply to Pull Requests.
Additionally, this Action's outputs allow you to make use of conditional/branching logic based on the presence/absence
of labels on the current PR.

## Example Usage

```yaml
    steps:
      - name: Offer PR Label Guidance
        uses: fountainhead/action-pr-label-assistant@v1.0.0
        id: labels
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          id: default
          whitelist: needs-manual-test,preview-instance

      - name: Create/Update Preview Instance
        if: steps.labels.outputs.preview-instance == 'present'

      - name: Terminate Preview Instance
        if: steps.labels.outputs.preview-instance == 'absent'
```

## Inputs

This Action accepts the following configuration parameters via `with:`

 - `token`

  **Required**

  The GitHub token to use for making API requests. Typically, this would be set to `${{ secrets.GITHUB_TOKEN }}`.

 - `id`

   **Required**

   Some identifier that is unique on a per-repository basis to allow multiple instances of this Action to operate on the
   same Pull Request.

 - `whitelist`

   **Required**

   A comma-separated list of slugified, lowercase label names to match against. This whitelist is used to determine
   which Labels should be presented in the 'guidance' comment, and which keys are outputted by this Action.

   For example, if you had a label named:

   :tada: Let's Party! :tada:

   You may match against it with a `whitelist` entry of `lets-party`.

 - `pre`

   **Optional**

   Some preamble text to display in the 'guidance' comment *before* the list of available Labels.

 - `post`

   **Optional**

   Some text to display in the 'guidance' comment *after* the list of available Labels.

## Outputs

For each entry specified in the `whitelist` input, an output with the same name will be emiited, having one of two possible values:

- `present` - The PR this Action ran against **does** have this Label assigned to it.
- `absent` - The PR this action ran against **does not** have this Label assigned to it.
