import * as guidance from '../src/guidance'

describe('repoLabels', () => {
  process.env.GITHUB_REPOSITORY = 'test'

  const mockClient = {
    issues: {
      listLabelsForRepo: jest.fn()
    }
  }

  it('filters repo labels by sanitized names', async () => {
    mockClient.issues.listLabelsForRepo.mockResolvedValue({
      data: [
        {
          name: ':rocket: Test',
          color: 'red',
          description: ''
        },
        {
          name: 'Test Two',
          color: 'white',
          description: ''
        },
        {
          name: 'Test Three',
          color: 'blue',
          description: 'This should be ignored'
        }
      ]
    })

    const result = await guidance.repoLabels(
      mockClient as any,
      ['test', 'test-two'],
      {
        owner: 'test-org',
        repo: 'test'
      }
    )

    expect(result).toEqual([
      {
        name: ':rocket: Test',
        color: 'red',
        description: ''
      },
      {
        name: 'Test Two',
        color: 'white',
        description: ''
      }
    ])
  })
})

describe('renderGuidance', () => {
  it('renders a list of labels to a Markdown-formatted message', () => {
    const output = guidance.renderGuidance(
      'test',
      [
        {
          name: ':wave: Hello World!',
          color: 'blue',
          description: 'Hello world!'
        },
        {
          name: 'Needs manual test',
          color: 'green',
          description: 'This PR needs to be checked out and tested by a Human'
        }
      ],
      '** This is a test **',
      '* Have a nice day *'
    )

    const expected = `
** This is a test **

The following labels may be assigned to this Pull Request:

| Label | Description |
|-------|-------------|
| ![:wave: Hello World!](https://labl.es/svg?text=%F0%9F%91%8B%20Hello%20World!&bgcolor=blue) | Hello world! |
| ![Needs manual test](https://labl.es/svg?text=Needs%20manual%20test&bgcolor=green) | This PR needs to be checked out and tested by a Human |

* Have a nice day *

\`id: pr-label-assistant-test\``

    expect(output).toBe(expected)
  })
})
