import {presence} from '../src/presence'

const mockClient = {
  issues: {
    listLabelsOnIssue: jest.fn()
  }
}

test('returns a map of whitelist entries and label presence', async () => {
  mockClient.issues.listLabelsOnIssue.mockResolvedValue({
    data: [
      {
        name: ':rocket: Test One'
      },
      {
        name: 'Test Three'
      }
    ]
  })

  const result = await presence({
    client: mockClient as any,
    whitelist: ['test-one', 'test-two'],
    prNumber: 99,
    repo: {
      repo: 'test',
      owner: 'test-co'
    }
  })

  expect(result).toEqual([
    {
      label: 'test-one',
      state: 'present'
    },
    {
      label: 'test-two',
      state: 'absent'
    }
  ])
})
