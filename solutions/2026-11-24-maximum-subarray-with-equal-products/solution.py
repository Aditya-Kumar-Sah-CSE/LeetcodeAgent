import math
from typing import List
from functools import reduce

class Solution:
    def maxLength(self, nums: List[int]) -> int:
        """
        A subarray is product equivalent if prod(arr) == lcm(arr) * gcd(arr).
        
        Key Insight:
        For any two numbers a and b, we know that a * b = gcd(a, b) * lcm(a, b).
        For a subarray of length 1, the condition is trivially true (x = x * x is only true if x=1, 
        but the problem asks for subarrays, and the formula prod = lcm * gcd always holds for length 1).
        For a subarray of length 2, the condition prod(a, b) = lcm(a, b) * gcd(a, b) is always true.
        For a subarray of length > 2, the condition prod(a, b, c, ...) = lcm(a, b, c, ...) * gcd(a, b, c, ...)
        is much stricter. It essentially means that the elements must be pairwise coprime 
        relative to the GCD of the whole set.
        
        Given the constraints (nums.length <= 100, nums[i] <= 10), we can use a brute-force 
        approach to check all possible subarrays.
        """
        
        def get_gcd(a, b):
            while b:
                a, b = b, a % b
            return a

        def get_lcm(a, b):
            if a == 0 or b == 0: return 0
            return abs(a * b) // get_gcd(a, b)

        n = len(nums)
        max_len = 0
        
        for i in range(n):
            current_prod = 1
            current_gcd = nums[i]
            current_lcm = nums[i]
            
            for j in range(i, n):
                val = nums[j]
                current_prod *= val
                current_gcd = get_gcd(current_gcd, val)
                current_lcm = get_lcm(current_lcm, val)
                
                # Optimization: Since nums[i] >= 1, current_prod grows quickly.
                # If current_prod exceeds a reasonable limit (lcm * gcd), 
                # it might still be equal, but since max nums[i] is 10 and n is 100,
                # we must be careful about integer overflow in other languages.
                # In Python, integers are arbitrary precision.
                
                if current_prod == current_lcm * current_gcd:
                    max_len = max(max_len, j - i + 1)
                
                # Heuristic: If current_prod becomes significantly larger than 
                # any possible LCM * GCD for the given constraints, we could break.
                # However, with N=100, O(N^2) is perfectly fine.
                
        return max_len
