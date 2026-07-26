# Cloud Run HRMS lockdown — 2026-07-26

Removed public (`allUsers`) invoker access from the two HRMS Cloud Run services after the
deployment assessment (docs/spec/full-coverage/security-deployment-assessment.md) confirmed both
were internet-reachable. Scoped strictly to the HRMS services; the unrelated puda/legalops/
estate-planning services were not touched.

## Before

| Service | Region | Public binding |
|---|---|---|
| government-hrms | asia-south1 | allUsers → roles/run.invoker |
| government-hrms-telangana-demo | asia-south1 | allUsers → roles/run.invoker |

## Action

    gcloud run services remove-iam-policy-binding government-hrms \
      --region=asia-south1 --member=allUsers --role=roles/run.invoker
    gcloud run services remove-iam-policy-binding government-hrms-telangana-demo \
      --region=asia-south1 --member=allUsers --role=roles/run.invoker

## Rollback (re-open public access, if the demo needs it)

    gcloud run services add-iam-policy-binding government-hrms \
      --region=asia-south1 --member=allUsers --role=roles/run.invoker
    gcloud run services add-iam-policy-binding government-hrms-telangana-demo \
      --region=asia-south1 --member=allUsers --role=roles/run.invoker

## Verification

Both IAM policies show no `allUsers` binding. Unauthenticated HTTP after ~40s propagation:

| Service | Before | After |
|---|---|---|
| government-hrms | 200 (public) | **403** (edge rejects) |
| government-hrms-telangana-demo | 200 (public) | **403** (edge rejects) |

The 403 is returned by Cloud Run's edge before the request reaches the container, so the
unverified-token weakness in the deployed build is no longer reachable from the internet. The
code-level fix (URF-02..04, server-side token verification) is still required before `main` is
deployed publicly — this lockdown removes the exposure of the *current* services, it does not fix
the source.
