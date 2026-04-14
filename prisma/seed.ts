import { PrismaClient, Difficulty } from '@prisma/client';
const prisma = new PrismaClient();

const questions = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: Difficulty.EASY,
    topic: 'Arrays & Hashing',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.`,
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] == 9' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Only one valid answer exists.'],
    starterCode: `def two_sum(nums, target):
    # Your solution here
    pass

import sys
data = sys.stdin.read().split()
n = int(data[0])
nums = list(map(int, data[1:n+1]))
target = int(data[n+1])
print(two_sum(nums, target))`,
    visibleTests: [
      { input: '4\n2 7 11 15\n9', expectedOutput: '[0, 1]' },
      { input: '3\n3 2 4\n6', expectedOutput: '[1, 2]' },
    ],
    hiddenTests: [
      { input: '2\n3 3\n6', expectedOutput: '[0, 1]' },
      { input: '4\n1 2 3 4\n7', expectedOutput: '[2, 3]' },
      { input: '3\n-1 -2 -3\n-5', expectedOutput: '[1, 2]' },
    ],
  },
  {
    id: 'climbing-stairs',
    title: 'Climbing Stairs',
    difficulty: Difficulty.EASY,
    topic: 'Dynamic Programming',
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top?`,
    examples: [
      { input: 'n = 2', output: '2', explanation: '1+1, 2' },
      { input: 'n = 3', output: '3', explanation: '1+1+1, 1+2, 2+1' },
    ],
    constraints: ['1 <= n <= 45'],
    starterCode: `def climb_stairs(n):
    # Your solution here
    pass

import sys
n = int(sys.stdin.read().strip())
print(climb_stairs(n))`,
    visibleTests: [
      { input: '2', expectedOutput: '2' },
      { input: '3', expectedOutput: '3' },
    ],
    hiddenTests: [
      { input: '1', expectedOutput: '1' },
      { input: '5', expectedOutput: '8' },
      { input: '10', expectedOutput: '89' },
      { input: '45', expectedOutput: '1836311903' },
    ],
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: Difficulty.EASY,
    topic: 'Stack',
    description: `Given a string containing just '(', ')', '{', '}', '[' and ']', determine if the input string is valid.`,
    examples: [
      { input: 's = "()"', output: 'True' },
      { input: 's = "()[]{}"', output: 'True' },
      { input: 's = "(]"', output: 'False' },
    ],
    constraints: ['1 <= s.length <= 10^4'],
    starterCode: `def is_valid(s):
    # Your solution here
    pass

import sys
s = sys.stdin.read().strip()
print(is_valid(s))`,
    visibleTests: [
      { input: '()', expectedOutput: 'True' },
      { input: '()[]{}', expectedOutput: 'True' },
      { input: '(]', expectedOutput: 'False' },
    ],
    hiddenTests: [
      { input: '([)]', expectedOutput: 'False' },
      { input: '{[]}', expectedOutput: 'True' },
      { input: '', expectedOutput: 'True' },
      { input: '((', expectedOutput: 'False' },
    ],
  },
  {
    id: 'longest-substring',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: Difficulty.MEDIUM,
    topic: 'Sliding Window',
    description: `Given a string \`s\`, find the length of the longest substring without repeating characters.`,
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: '"abc"' },
      { input: 's = "bbbbb"', output: '1' },
    ],
    constraints: ['0 <= s.length <= 5 * 10^4'],
    starterCode: `def length_of_longest_substring(s):
    # Your solution here
    pass

import sys
s = sys.stdin.read().strip()
print(length_of_longest_substring(s))`,
    visibleTests: [
      { input: 'abcabcbb', expectedOutput: '3' },
      { input: 'bbbbb', expectedOutput: '1' },
    ],
    hiddenTests: [
      { input: 'pwwkew', expectedOutput: '3' },
      { input: '', expectedOutput: '0' },
      { input: 'dvdf', expectedOutput: '3' },
      { input: 'abcdef', expectedOutput: '6' },
    ],
  },
  {
    id: 'coin-change',
    title: 'Coin Change',
    difficulty: Difficulty.MEDIUM,
    topic: 'Dynamic Programming',
    description: `Given an integer array \`coins\` and an integer \`amount\`, return the fewest number of coins needed to make up that amount. Return -1 if not possible.`,
    examples: [
      { input: 'coins = [1,5,11], amount = 11', output: '1' },
      { input: 'coins = [2], amount = 3', output: '-1' },
    ],
    constraints: ['1 <= coins.length <= 12', '0 <= amount <= 10^4'],
    starterCode: `def coin_change(coins, amount):
    # Your solution here
    pass

import sys
data = sys.stdin.read().split()
n = int(data[0])
coins = list(map(int, data[1:n+1]))
amount = int(data[n+1])
print(coin_change(coins, amount))`,
    visibleTests: [
      { input: '3\n1 5 11\n11', expectedOutput: '1' },
      { input: '1\n2\n3', expectedOutput: '-1' },
    ],
    hiddenTests: [
      { input: '1\n1\n0', expectedOutput: '0' },
      { input: '3\n1 2 5\n11', expectedOutput: '3' },
      { input: '2\n2 5\n7', expectedOutput: '2' },
    ],
  },
  {
    id: 'number-of-islands',
    title: 'Number of Islands',
    difficulty: Difficulty.MEDIUM,
    topic: 'Graph BFS/DFS',
    description: `Given an m x n 2D binary grid representing a map of '1's (land) and '0's (water), return the number of islands.`,
    examples: [
      { input: 'grid = [["1","1","0"],["0","1","0"],["0","0","1"]]', output: '2' },
    ],
    constraints: ['1 <= m, n <= 300'],
    starterCode: `def num_islands(grid):
    # Your solution here
    pass

import sys
lines = sys.stdin.read().strip().split('\\n')
grid = [list(line) for line in lines]
print(num_islands(grid))`,
    visibleTests: [
      { input: '110\n010\n001', expectedOutput: '2' },
    ],
    hiddenTests: [
      { input: '111\n010\n111', expectedOutput: '1' },
      { input: '1', expectedOutput: '1' },
      { input: '0', expectedOutput: '0' },
    ],
  },
  {
    id: 'median-two-arrays',
    title: 'Median of Two Sorted Arrays',
    difficulty: Difficulty.HARD,
    topic: 'Binary Search',
    description: `Given two sorted arrays \`nums1\` and \`nums2\`, return the median. Time complexity should be O(log(m+n)).`,
    examples: [
      { input: 'nums1=[1,3], nums2=[2]', output: '2.0' },
      { input: 'nums1=[1,2], nums2=[3,4]', output: '2.5' },
    ],
    constraints: ['0 <= m, n <= 1000'],
    starterCode: `def find_median_sorted_arrays(nums1, nums2):
    # Your solution here
    pass

import sys
lines = sys.stdin.read().strip().split('\\n')
nums1 = list(map(int, lines[0].split()))
nums2 = list(map(int, lines[1].split()))
result = find_median_sorted_arrays(nums1, nums2)
print(result)`,
    visibleTests: [
      { input: '1 3\n2', expectedOutput: '2.0' },
      { input: '1 2\n3 4', expectedOutput: '2.5' },
    ],
    hiddenTests: [
      { input: '0 0\n0 0', expectedOutput: '0.0' },
      { input: '\n1', expectedOutput: '1.0' },
      { input: '2\n1 3', expectedOutput: '2.0' },
    ],
  },
  {
    id: 'merge-k-lists',
    title: 'Merge K Sorted Lists',
    difficulty: Difficulty.HARD,
    topic: 'Linked List & Heap',
    description: `You are given k linked-lists, each sorted in ascending order. Merge all into one sorted list.`,
    examples: [
      { input: 'lists = [[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]' },
    ],
    constraints: ['k == lists.length', '0 <= k <= 10^4'],
    starterCode: `import heapq
import sys

def merge_k_lists(lists):
    # Your solution here
    pass

lines = sys.stdin.read().strip().split('\\n')
lists = [list(map(int, l.split())) if l.strip() else [] for l in lines]
print(merge_k_lists(lists))`,
    visibleTests: [
      { input: '1 4 5\n1 3 4\n2 6', expectedOutput: '[1, 1, 2, 3, 4, 4, 5, 6]' },
    ],
    hiddenTests: [
      { input: '', expectedOutput: '[]' },
      { input: '1\n', expectedOutput: '[1]' },
      { input: '1 2 3\n4 5 6', expectedOutput: '[1, 2, 3, 4, 5, 6]' },
    ],
  },
];

async function main() {
  console.log('Seeding database...');
  for (const q of questions) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: { visibleTests: q.visibleTests, hiddenTests: q.hiddenTests, starterCode: q.starterCode },
      create: q,
    });
  }
  console.log(`Seeded ${questions.length} questions with test cases.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
