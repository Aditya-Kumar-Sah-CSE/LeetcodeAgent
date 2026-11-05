class Solution:
    def findTheDistanceValue(self, arr1: list[int], arr2: list[int], d: int) -> int:
        arr2.sort()
        count = 0
        import bisect
        
        for x in arr1:
            # Find the first index in arr2 where value >= x
            idx = bisect.bisect_left(arr2, x)
            ok = True
            
            # Check the element at idx (first >= x)
            if idx < len(arr2) and arr2[idx] - x <= d:
                ok = False
            # Check the element just before idx (largest < x)
            if idx > 0 and x - arr2[idx - 1] <= d:
                ok = False
            
            if ok:
                count += 1
        
        return count
