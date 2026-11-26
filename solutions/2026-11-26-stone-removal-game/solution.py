class Solution:
    def canAliceWin(self, n: int) -> bool:
        stones = n
        remove = 10
        alice_turn = True
        
        # Simulate the game turn by turn.
        while stones >= remove:
            stones -= remove
            remove -= 1
            alice_turn = not alice_turn
        
        # When the loop ends, the player whose turn it is cannot make a move and loses.
        # If it is Alice's turn, she loses; if it is Bob's turn, Alice wins.
        return not alice_turn
