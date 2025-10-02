import { Typography, Grid } from '@material-ui/core';
import {
  InfoCard,
  Header,
  Page,
  Content,
} from '@backstage/core-components';

export const CloudSecurityDashboard = () => (
  <Page themeId="website">
    <Header title="Cloud Security Dashboard" subtitle="Monitor cloud security posture and compliance" />
    <Content>
      <Grid container spacing={3} direction="column">
        <Grid item>
          <InfoCard title="Cloud Security Overview">
            <Typography variant="body1">
              🚧 Coming Soon ! 🚧
            </Typography>
          </InfoCard>
        </Grid>
      </Grid>
    </Content>
  </Page>
);
