package provider

import (
	"context"
	"os"

	"github.com/hashicorp/terraform-plugin-framework/datasource"
	"github.com/hashicorp/terraform-plugin-framework/provider"
	"github.com/hashicorp/terraform-plugin-framework/provider/schema"
	"github.com/hashicorp/terraform-plugin-framework/resource"
	"github.com/hashicorp/terraform-plugin-framework/types"
	"github.com/saturn/terraform-provider-saturn/internal/client"
)

// Ensure SaturnProvider satisfies various provider interfaces.
var _ provider.Provider = &SaturnProvider{}

// SaturnProvider defines the provider implementation.
type SaturnProvider struct {
	// version is set to the provider version on release, "dev" when the
	// provider is built and ran locally, and "test" when running acceptance
	// testing.
	version string
}

// SaturnProviderModel describes the provider data model.
type SaturnProviderModel struct {
	APIKey   types.String `tfsdk:"api_key"`
	Endpoint types.String `tfsdk:"endpoint"`
}

func (p *SaturnProvider) Metadata(ctx context.Context, req provider.MetadataRequest, resp *provider.MetadataResponse) {
	resp.TypeName = "saturn"
	resp.Version = p.version
}

func (p *SaturnProvider) Schema(ctx context.Context, req provider.SchemaRequest, resp *provider.SchemaResponse) {
	resp.Schema = schema.Schema{
		MarkdownDescription: "Saturn provider for managing monitoring infrastructure as code.",
		Attributes: map[string]schema.Attribute{
			"api_key": schema.StringAttribute{
				MarkdownDescription: "Saturn API Key. Can also be set via SATURN_API_KEY environment variable.",
				Optional:            true,
				Sensitive:           true,
			},
			"endpoint": schema.StringAttribute{
				MarkdownDescription: "Saturn API endpoint. Defaults to https://saturn.co. Can also be set via SATURN_ENDPOINT environment variable.",
				Optional:            true,
			},
		},
	}
}

func (p *SaturnProvider) Configure(ctx context.Context, req provider.ConfigureRequest, resp *provider.ConfigureResponse) {
	var config SaturnProviderModel

	resp.Diagnostics.Append(req.Config.Get(ctx, &config)...)

	if resp.Diagnostics.HasError() {
		return
	}

	// Configuration values are now available.
	// If configuration values are unknown, it could be due to provider defaults, return early.
	if config.APIKey.IsUnknown() {
		return
	}

	// Default values to environment variables, but override
	// with Terraform configuration value if set.
	apiKey := os.Getenv("SATURN_API_KEY")
	endpoint := os.Getenv("SATURN_ENDPOINT")

	if !config.APIKey.IsNull() {
		apiKey = config.APIKey.ValueString()
	}

	if !config.Endpoint.IsNull() {
		endpoint = config.Endpoint.ValueString()
	}

	// If endpoint is not set, use default
	if endpoint == "" {
		endpoint = "https://saturn.co"
	}

	// If any of the expected configurations are missing, return
	// errors with provider-specific guidance.
	if apiKey == "" {
		resp.Diagnostics.AddError(
			"Missing API Key Configuration",
			"While configuring the provider, the API key was not found in "+
				"the SATURN_API_KEY environment variable or provider "+
				"configuration block api_key attribute.",
		)
	}

	if resp.Diagnostics.HasError() {
		return
	}

	// Create a new Saturn client using the configuration values
	client := client.NewClient(endpoint, apiKey)

	// Make the Saturn client available during DataSource and Resource
	// type Configure methods.
	resp.DataSourceData = client
	resp.ResourceData = client
}

func (p *SaturnProvider) Resources(ctx context.Context) []func() resource.Resource {
	return []func() resource.Resource{
		NewMonitorResource,
		NewAlertRuleResource,
		NewIntegrationResource,
		NewStatusPageResource,
	}
}

func (p *SaturnProvider) DataSources(ctx context.Context) []func() datasource.DataSource {
	return []func() datasource.DataSource{
		NewMonitorDataSource,
	}
}

func New(version string) func() provider.Provider {
	return func() provider.Provider {
		return &SaturnProvider{
			version: version,
		}
	}
}

