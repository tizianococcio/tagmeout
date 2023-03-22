# TagMeOut
Obsidian plug-in to extract the headers that follow each of the specified tags.

## Example
    ```tagsummary
    JobHunt:waiting,rejected,followup
    ```

Given that in the **same** folder there is a file called 'JobHunt', it renders something like this:
# #waiting (2)
- Company 1 Link
- Company 2 Link

# #rejected (4)
- Company 3 Link
- Company 4 Link
- Company 5 Link
- Company 6 Link

# #followup (3)
- Company 7 Link
- Company 8 Link
- Company 9 Link

Where Link takes you to the note in your vault containing that header.

## Disclaimer
I put this together in 2 hours, so it's probably not very robust. Feel free to leave some feedback or suggestions for improvement.
