# Migrating from TM to TFS

This document describe how we can set up TFS queries, tags, and task states to mimic the KAT TM workflow when creating and working with tasks for projects built on the Evolution framework.

To enable this, you will create custom queries that filter based on 'KAT tags' describing each client.  Tags are used simply due to the fact that we can't create new clients without the help of an admin.  So using a single project (`HRS2/KAT`) with custom tags was the easiest transition.

After [TFS Queries](#tfs-queries-to-emulate-tm-workflow) are set up, you will use a work flow that is managed based on `Created By`, `Assigned To` and `State` fields.  The [Task Workflow](#task-workflow) section describes the workflow in detail.

In this document, 'Requestors' are the people who create the tasks, and 'Workers' are the people who implement the tasks.

## TFS Queries To Emulate TM Workflow

### Client Specific Queries

#### To Do Query

#### Pending Notifications Query

#### To Review Query

#### To Publish Query

#### All Tasks Query

### Client Independent Queries

#### All Tasks To Do Query

#### All Tasks To Review Query


## Task Workflow

This section describes the workflow for creating and working with tasks from the perspective of the Requestor and the Worker.

### Requestor Workflows

This section describes the workflow for creating and working with tasks from the perspective of the Requestor.

#### Creating Task

The steps below describe how to create a task.

1. If creating a Spec Sheet request task:
	1. Update the Spec Sheet `Requirement` task by uploading the latest Spec Sheet and updating the title of the task to reflect the version.
	1. Optional; Would be *nice* to copy the ID of the spec task before starting task, then when creating the 'request' task, create a link of type `Parent` and paste the Spec Sheet task ID in.  Makes it easier for Worker to download the file.
1. Add correct `Tag`... `KAT {clientName}`.
1. Set `Title` using a prefix of `{clientName} ` (from tag used in previous step).  This aids in the [All Tasks To Do Query](#all-tasks-to-do-query).
1. Set `Assigned To` to the appropriate person.  This sends a notification and makes their [Tasks to Do Query](#tasks-to-do) work.
1. Optional; Attach any required files/screenshots in the 'attachments' tab/area.
1. Optional; If the task is related to other task(s), or points to a task (within current KAT Client or across all KAT Clients) that implemented a similar feature, you could add link of type `Related` to task in the 'links' tab/area.

#### To Reopen Task That Is Review

After reviewing an implemented task, if there are existing issues or new issues, simply:

1. Set `Assigned To` to the appropriate person (to make notification and 'Tasks to Do' query work)
1. Change State to Active
1. Update Discussion with more information

#### To Request Production Publish
1. Create new task with as described above but title says 'Publish to Production' (could use this if you have several tasks and you just wanted a clean one), or:
1. Choose one or more tasks in 'Tasks to Review' and 
	1. Assign to appropriate person
	1. Update Discussion with request to publish


### Worker Workflows

This section describes the workflow for creating and working with tasks from the perspective of the Worker.

#### To Start Working on Task

As a Worker, when you start working on a task, simply:

1. Set `State` to Active
1. Save the task and start working.

#### To Request Additional Information

If you the Worker of a task, but need additional information from the Requestor who created the task, simply:

1. Set `Assign To` back to the Requestor (can find this in the 'History' tab/area of the task if you don't know).  This triggers a notification to the Requestor, but we use `Assigned To` instead of `@id` in `Discussions` to make the [Tasks to Do Query](#tasks-to-do) work.
1. Ask your questions to the Requestor via the `Discussion` area.
1. Optional; `@` additional people if you want them to receive notifications and/or they are able to provide information as well.
1. Save the task.

#### To Complete Task And Notify Immediately

As the Worker of a task, when you have completed a task and are ready to publish and notify the Requestor, simply:

1. Publish to QA
1. Set `Assign To` back to the Requestor (can find this in the 'History' tab/area of the task if you don't know).  This triggers a notification to the Requestor, but we use `Assigned To` instead of `@id` in `Discussions` to make their [Tasks to Review Query](#tasks-to-review) work.
1. Set `State` = Resolved.
1. Add a `Discussion` with any relevant information about your implementation (usually 'Done' is suffice).
1. Save the task.

#### Task Batches

As the Worker, you can choose to work on a batch of tasks and postpone notifying the Requestor until all tasks have been published at once.

##### To Complete Task Without Notifying Requestor Immediately

As the Worker of a task, there maybe be several tasks you plan on doing before publishing the site and you don't want the Requestor to be notified on each one until you've finished the batch of tasks.  This is the same as the TM 'Pending Notifications' state.  To accomplish this:

1. Set `Triage` to `Triaged`.  This will move the task out of the [Tasks to Do Query](#tasks-to-do) and into the [Pending Notifications Query](#pending-notifications-query).
1. Add a `Discussion` with any relevant information about your implementation (usually 'Done' is suffice).
1. Save the task.

##### To Notify Requestor Multiple Tasks Are Ready For Review

As the Worker of a task, when you have completed a batch of tasks and are ready to publish and notify the Requestor (this is the same as clicking 'Send Notification' in TM), simply:

1. Publish site to QA.
1. Go to your [Pending Notifications Query](#pending-notifications-query) and select all tasks you want to notify the Requestor about and:
	1. Set `Assign To` back to the Requestor (can find this in the 'History' tab/area of the task if you don't know).  This triggers a notification to the Requestor, but we use `Assigned To` instead of `@id` in `Discussions` to make their [Tasks to Review Query](#tasks-to-review) work.
	1. Set `Triage` = Pending (or anything other than Triaged). This will move it out of the Pending Notifications Query.
	1. Set `State` = Resolved.
	1. Save the tasks.


### After Publishing to Production
1. Assign to owner (to notify them)
1. Change State to Closed

### Task State According to Flow

Below are different 'states' a task can be in.  They are the fields that drive the TFS queries.

#### Tasks To Do

1. `State`: Active, Proposed
1. `Assigned To`: Me

#### Tasks To Publish To QA (DEVs - TM Pending Notifications)

1. `State`: Resolved
1. `Assigned To`: Me

#### Tasks To Review

1. `State`: Resolved
1. `Assigned To`: Me
1. `Created By`: Me

#### Tasks To Publish (DEVs)

1. `State`: Resolved
1. `Assigned To`: Me
1. `Created By`: NOT Me