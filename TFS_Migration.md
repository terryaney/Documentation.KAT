## Task State According to Flow

### Tasks To Do
Active/Proposed
Assigned To Me

### Tasks To Publish To QA (DEVs - TM Pending Notifications)
Resolved
Assigned To Me

### Tasks To Review
Resolved
Assigned To Me
Created By Me

### Tasks To Publish (DEVs)
Resolved
Assigned To Me
NOT Created By Me

## Creating Task
1. If creating a Spec Sheet request task, would be *nice* to copy the ID of the spec task before starting task, then when creating tasks, create a link of type 'Parent' and paste the spec sheet task ID in.  Makes it easier for me to retreive but not necessary.
1. Add correct tag for KAT ... 'KAT {clientName}'
1. Set title (to aid in 'all task' queries, prefix with {clientName} that matches tag)
1. Assign to Terry (I'll delegate as needed)
1. Attach any required files if needed
1. (Advanced) If related to other task(s) (within current KAT Client or across all KAT Clients), could add link to task in the 'links' tab/area.

## To Start Working on Task
1. When starting, change state to Active and save

## To Request Additional Information
1. Assign back to owner (to make notification and 'Tasks to Do' query work)
1. Update the Discussion with your questions (@ additional people if you want them to receive notifications)

## To Complete Task Without Notifying Owner Yet (TM - Pending Notifications)
1. Change Triage = Triaged
1. Update Discussion with any relevant notes (usually 'Done' is suffice).

## To Notify Owner Multiple Tasks Are Ready For Review (TM - Send Notifications)
1. Publish to QA (DEVs)
1. Change all tasks 
	1. Assign back to owner (to make notification and 'Tasks to Review' query work)
	1. Change Triage = Pending (or anything other than Triaged)

## To Complete Task And Notify Immeidately
1. Publish to QA (DEVs)
1. Assign back to owner (to make notification 'Tasks to Review' query work)
1. Change State to Resolved
1. Update Discussion with any relevant notes (usually 'Done' is suffice).

## To Reopen Task That Is Review
1. Assign to appropriate person (to make notification and 'Tasks to Do' query work)
1. Change State to Active
1. Update Discussion with more information

## To Request Production Publish
1. Create new task with as described above but title says 'Publish to Production' (could use this if you have several tasks and you just wanted a clean one), or:
1. Choose one or more tasks in 'Tasks to Review' and 
	1. Assign to appropriate person
	1. Update Discussion with request to publish

## After Publishing to Production
1. Assign to owner (to notify them)
1. Change State to Closed