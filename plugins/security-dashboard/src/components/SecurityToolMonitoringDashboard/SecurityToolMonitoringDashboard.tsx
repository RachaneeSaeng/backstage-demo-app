import { Typography, Grid } from '@material-ui/core';
import {
  InfoCard,
  Header,
  Page,
  Content,
  ContentHeader,
  HeaderLabel,
  SupportButton,
} from '@backstage/core-components';
import { SecurityToolMonitoringTable } from '../SecurityToolMonitoringTable';

export const SecurityToolMonitoringDashboard = () => (
  <Page themeId="tool">
    <Header title="Security Dashboard" subtitle="To monitor security scanning across our repositories">
      {/* <HeaderLabel label="Owner" value="Team X" />
      <HeaderLabel label="Lifecycle" value="Alpha" /> */}
    </Header>
    <Content>
      {/* <ContentHeader title="Security Monitoring Dashboard">
        <SupportButton>To monitor security tool adoption and detected issues across our repositories</SupportButton>
      </ContentHeader> */}
      <Grid container spacing={3} direction="column">
        {/* <Grid item>
          <InfoCard>
            <Typography variant="body1">
              To display status of security tools and issues detected across our repositories.
              The tools we are currently integrating are aligned with the {' '}
              <a href="https://www.google.com" target="_blank">
                 Security Tools Sensible Defaults.
              </a>
            </Typography>
          </InfoCard>
        </Grid> */}
        <Grid item container>
          <SecurityToolMonitoringTable />
        </Grid>
      </Grid>
    </Content>
  </Page>
);
