class Solution:
    def minChanges(self, s: str) -> int:
        """
        Returns the minimum number of character changes required to make the binary string beautiful.
        A string is beautiful if it can be partitioned into even-length substrings of all '0's or all '1's.
        The optimal strategy is to consider each consecutive pair of characters (since any even-length
        uniform block can be split into length-2 uniform blocks). For each pair, if the two characters
        differ, we need exactly one change to make them equal (either "00" or "11").
        """
        changes = 0
        # Iterate over the string in steps of 2
        for i in range(0, len(s), 2):
            if s[i] != s[i + 1]:
                changes += 1
        return changes
