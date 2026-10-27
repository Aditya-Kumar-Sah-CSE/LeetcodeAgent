//  LeetCode 21. Merge Two Sorted Lists
//  Time Complexity : O(n + m) where n and m are the lengths of the two lists.
//  Space Complexity: O(1) auxiliary space (in‑place merging).

/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */

class Solution {
public:
    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {
        // Dummy node simplifies handling of the head of the merged list.
        ListNode dummy(0);
        ListNode* tail = &dummy;

        // Merge while both lists have nodes.
        while (list1 != nullptr && list2 != nullptr) {
            if (list1->val <= list2->val) {
                tail->next = list1;   // attach node from list1
                list1 = list1->next;  // move forward in list1
            } else {
                tail->next = list2;   // attach node from list2
                list2 = list2->next;  // move forward in list2
            }
            tail = tail->next;        // advance the tail
        }

        // Exactly one of list1 or list2 can be non‑null here.
        tail->next = (list1 != nullptr) ? list1 : list2;

        // dummy.next points to the head of the merged list.
        return dummy.next;
    }
};